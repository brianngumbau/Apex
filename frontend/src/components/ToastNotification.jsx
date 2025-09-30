import React from "react";

const ToastNotification = ({ message }) =>
  message ? (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow">
      {message}
    </div>
  ) : null;

export default ToastNotification;
