import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";

const ErrorModal = ({ errorModalOpen, setErrorModalOpen }) => {
  if (!errorModalOpen) return null;

  // Determine if the content is a React element or just text
  const isReactElement = typeof errorModalOpen === "object";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg max-w-md w-full border border-red-500 shadow-lg overflow-hidden animate-slideUp">
        <div className="bg-red-600 p-4 flex items-center">
          <FaExclamationTriangle className="text-white mr-3" size={24} />
          <h3 className="text-xl font-bold text-white">
            {isReactElement &&
            errorModalOpen.props?.children?.[0]?.type === "h3"
              ? errorModalOpen.props.children[0].props.children
              : "Error"}
          </h3>
        </div>

        <div className="p-6">
          {isReactElement ? (
            // If it's a React element, render it directly
            errorModalOpen
          ) : (
            // Otherwise render as text
            <p className="mb-6 text-white whitespace-pre-line">
              {errorModalOpen}
            </p>
          )}

          {!isReactElement && (
            <div className="flex justify-end">
              <button
                onClick={() => setErrorModalOpen(null)}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-lg transition-colors shadow-md"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
