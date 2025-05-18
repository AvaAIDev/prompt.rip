import React, { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { bottts } from "@dicebear/collection";

const UserAvatar = ({ seed, size = 40 }) => {
  // Generate avatar using DiceBear
  const avatar = useMemo(() => {
    return createAvatar(bottts, {
      seed,
      size,
      radius: 50,
      baseColor: ["C6F300"],
    });
  }, [seed, size]);

  return (
    <div className="user-avatar">
      <img src={avatar.toDataUri()} alt="User Avatar" />

      <style>{`
        .user-avatar {
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid var(--health-green);
          box-shadow: 0 0 10px rgba(34, 204, 91, 0.3);
          flex-shrink: 0;
          background-color: #000;
          padding: 5px;
          margin-right: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default UserAvatar;
