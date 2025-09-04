import styles from './messageList.module.css';
import React, { useState } from 'react';

type Chat = { sender: string; message: string; isImage?: boolean };

const MessageList: React.FC = () => {
  const [userMessage, setUserMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const sendMessage = async () => {
    if (!userMessage.trim()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("prompt", userMessage);
      if (imageFile) {
        formData.append("file", imageFile);
      }

      const responst = await fetch("https://chatwithllm-hol6.onrender.com/uploadfile/", {
        method: "POST",
        body: formData,
      });

      if (!responst.ok) {
        throw new Error("Network response was not ok");
      }
      
      const data = await responst.json();

      if (imageFile) {
        setChatHistory((prev) => [
          ...prev,
          { sender: "user", message: userMessage, isImage: false },
          { sender: "user", message: URL.createObjectURL(imageFile), isImage: true },
          { sender: "bot", message: data.response, isImage: false },
        ]);
        setImageFile(null);
      } else { 
        setChatHistory((prev) => [
          ...prev,
          { sender: "user", message: userMessage, isImage: false },
          { sender: "bot", message: data.response, isImage: false },
        ]);
      }

      setUserMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setImageFile(file);
    }
  };
  
  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Chat with GPT</h1>
      <div className={styles.chatBox}>
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`${styles.message} ${chat.sender === "user" ? styles.userMessage : styles.botMessage}`}
          > 
            {chat.isImage ? (
              <img
                src={chat.message}
                alt="Uploaded"
                className={styles.image}
              />
            ) : (
              chat.message
            )}
          </div>
        ))}
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Type your message..."
          className={styles.input}
          disabled={loading}
        />
        <label htmlFor="image-upload" className={styles.paperclipButton}>
          📎  
        </label>
        <input 
          id="image-upload"
          type="file"
          accept="image/*"
          className={styles.inputImage}
          onChange={handleImageChange}
        />
        <button onClick={sendMessage} className={styles.button} disabled={loading}>
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default MessageList;
