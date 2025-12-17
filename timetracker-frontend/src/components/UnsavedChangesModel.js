// src/components/UnsavedChangesModal.js
import React from "react";
import "./css/UnsavedChangesModel.css";

const UnsavedChangesModal = ({ visible, onConfirm, unSave, onCancel }) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p>You have unsaved changes! Do you want to leave without saving the data?</p>
        <div className="modal-actions">

           <button className="btn unSave-btn" onClick={unSave}>
             Yes
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
