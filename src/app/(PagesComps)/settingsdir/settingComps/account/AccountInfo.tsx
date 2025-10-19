import { useState, useEffect } from "react";
import { X } from "lucide-react";

type User = {
  id: number;
  phoneNumber: string;
  username: string;
  name: string;
  bio?: string;
  email?: string;
  location?: string;
  website?: string;
  profilePicture?: string;
  coverPhoto?: string;
  dateOfBirth?: string;
  preferredLang?: string;
  privacy: string;
};

type AccountInfoProps = {
  closeModal: () => void;
  user: User;
};

const themes = ["light", "super-light", "dark", "super-dark", "gold"] as const;

const AccountInfo = ({ closeModal, user }: AccountInfoProps) => {
  const [theme, setTheme] = useState<(typeof themes)[number]>("dark");

  // Apply theme to <html> or <body>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden theme-bg-secondary theme-shadow">
        {/* Header */}
        <div className="flex justify-between items-center p-4 theme-bg-tertiary border-b theme-border">
          <h2 className="text-xl font-semibold theme-text-primary">
            Account Information
          </h2>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-black/10 transition"
          >
            <X className="w-5 h-5 theme-text-primary" />
          </button>
        </div>

        {/* Cover Photo */}
        <div className="relative h-40 theme-bg-primary">
          {user.coverPhoto ? (
            <img
              src={user.coverPhoto}
              alt="cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full theme-gradient-primary"></div>
          )}
          <div className="absolute -bottom-12 left-6">
            <img
              src={
                user.profilePicture ||
                "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
              }
              alt="profile"
              className="w-24 h-24 rounded-full border-4 theme-border object-cover"
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-14 px-6 pb-6 space-y-3 theme-text-secondary">
          <h3 className="text-2xl font-bold theme-text-primary">
            {user.name}
          </h3>
          <p className="theme-text-muted">@{user.username}</p>
          {user.bio && <p className="italic">{user.bio}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <InfoItem label="Phone" value={user.phoneNumber} />
            <InfoItem label="Email" value={user.email} />
            <InfoItem label="Location" value={user.location} />
            <InfoItem label="Website" value={user.website} />
            <InfoItem
              label="Date of Birth"
              value={
                user.dateOfBirth
                  ? new Date(user.dateOfBirth).toLocaleDateString()
                  : "Not set"
              }
            />
            <InfoItem label="Language" value={user.preferredLang} />
            <InfoItem label="Privacy" value={user.privacy} />
          </div>
        </div>

        {/* Theme Selector */}
        <div className="flex justify-between items-center border-t theme-border p-4">
          <p className="theme-text-muted">Theme:</p>
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1 rounded-full capitalize text-sm border theme-border transition-all ${
                  theme === t
                    ? "theme-accent-primary font-semibold"
                    : "hover:opacity-75 theme-text-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="flex flex-col border-b theme-border pb-2">
    <span className="text-sm theme-text-muted">{label}</span>
    <span className="font-medium theme-text-primary">
      {value || "Not provided"}
    </span>
  </div>
);

export default AccountInfo;
