const Message = require("../models/Message");


exports.sendMessage = async (req, res) => {
  try {
    const { sender, receiver, content } = req.body;

    if (!sender || !receiver || !content) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMessage = new Message({ sender, receiver, content });
    await newMessage.save();

    // Create Notification
    const Notification = require("../models/Notification");
    const notif = await Notification.create({
      recipient: receiver,
      sender,
      type: "message",
      message: "sent you a direct message",
      referenceId: newMessage._id
    });
    const populatedNotif = await notif.populate("sender", "name profileImage");

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
    if (io && onlineUsers) {
      const receiverSocket = onlineUsers.get(receiver.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit("newNotification", populatedNotif);
      }
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
