import React from 'react';
import './Modal.css';

/**
 * Універсальне модальне вікно.
 * 
 * Два режими:
 * - alert: тільки кнопка "OK" (onConfirm)
 * - confirm: кнопки "OK" і "Скасувати" (onConfirm + onCancel)
 */
const Modal = ({ isOpen, message, onConfirm, onCancel, type = 'confirm' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={type === 'alert' ? onConfirm : onCancel}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-top-line" />
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          {type === 'confirm' && (
            <button className="modal-btn modal-btn-cancel" onClick={onCancel}>
              Скасувати
            </button>
          )}
          <button className="modal-btn modal-btn-ok" onClick={onConfirm}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;