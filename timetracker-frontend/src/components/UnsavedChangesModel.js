// src/components/UnsavedChangesModal.js
import React from "react";
import "./css/UnsavedChangesModel.css";

const UnsavedChangesModal = ({ visible, onConfirm, unSave, onCancel }) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>You have unsaved changes! Do You Want to Save Data?</p>
        <div className="modal-actions">
          <button className="btn confirm-btn" onClick={onConfirm}>
            Yes
          </button>
           <button className="btn unSave-btn" onClick={unSave}>
             No
            </button>
          <button className="btn cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesModal;
