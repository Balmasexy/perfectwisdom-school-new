import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  getSavedRole,
  saveRole,
  roleName,
  type UserRole,
} from "./role-system";

type Props = {
  onRoleChange?: (role: UserRole) => void;
};

const roles: UserRole[] = ["admin", "staff", "parent"];

export default function RoleSelector({ onRoleChange }: Props) {
  const [role, setRole] = useState<UserRole>(getSavedRole);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", close);

    return () => {
      document.removeEventListener("mousedown", close);
    };
  }, []);

  const selectRole = (nextRole: UserRole) => {
    setRole(nextRole);
    saveRole(nextRole);
    setOpen(false);
    onRoleChange?.(nextRole);
  };

  return (
    <div className="role-selector" ref={ref}>
      <button
        type="button"
        className="role-selector-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{roleName(role)}</span>
        <ChevronDown
          size={18}
          className={open ? "role-chevron-open" : ""}
        />
      </button>

      {open && (
        <div className="role-selector-menu">
          {roles.map((item) => (
            <button
              type="button"
              key={item}
              className="role-selector-option"
              onClick={() => selectRole(item)}
            >
              <span>{roleName(item)}</span>
              {role === item && <Check size={17} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
