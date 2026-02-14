import { useEffect, useState, type CSSProperties, type FormEvent, type ReactElement } from "react";
import type { InviteInfo } from "@odyssey/shared";
import { acceptInvite, fetchInviteInfo } from "../../api/invite";
import { useAuthStore } from "../../store/auth";

interface InviteAcceptScreenProps {
  token: string;
  onComplete: () => void;
}

/**
 * Full-page invite acceptance screen.
 * Fetches invite info and presents a registration form for the invited student.
 */
export function InviteAcceptScreen(props: InviteAcceptScreenProps): ReactElement {
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetchInviteInfo(props.token)
      .then((info) => {
        setInviteInfo(info);
        setIsLoading(false);
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Invalid invite link");
        setIsLoading(false);
      });
  }, [props.token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await acceptInvite(props.token, { displayName, password });
      /* Persist auth state so the student is logged in immediately. */
      const authPayload = {
        accessToken: response.accessToken,
        user: response.user
      };
      localStorage.setItem("odyssey-client-auth", JSON.stringify(authPayload));
      useAuthStore.setState({
        accessToken: response.accessToken,
        user: response.user,
        isLoading: false,
        errorMessage: null
      });
      /* Clean the URL and proceed to the game. */
      window.history.replaceState(null, "", "/");
      props.onComplete();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to accept invite");
      setIsLoading(false);
    }
  };

  if (isLoading && !inviteInfo) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Archive Raiders</h1>
          <p style={subtitleStyle}>Loading invite...</p>
        </div>
      </div>
    );
  }

  if (!inviteInfo) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <h1 style={titleStyle}>Archive Raiders</h1>
          <p style={subtitleStyle}>Invalid Invite</p>
          {errorMessage ? <p style={errorStyle}>{errorMessage}</p> : null}
          <a href="/" style={linkStyle}>Go to login</a>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <h1 style={titleStyle}>Archive Raiders</h1>
        <h2 style={subtitleStyle}>You&apos;re Invited!</h2>

        <p style={infoStyle}>
          Join the classroom <strong>{inviteInfo.classroomName}</strong>
        </p>

        <label style={labelStyle}>
          Email
          <input
            readOnly
            style={{ ...inputStyle, opacity: 0.7 }}
            value={inviteInfo.email}
          />
        </label>

        <label style={labelStyle}>
          Display name
          <input
            required
            style={inputStyle}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <label style={labelStyle}>
          Password
          <input
            required
            minLength={8}
            type="password"
            style={inputStyle}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <button disabled={isLoading} type="submit" style={primaryButtonStyle}>
          {isLoading ? "Creating account\u2026" : "Accept invite & join"}
        </button>

        {errorMessage ? <p style={errorStyle}>{errorMessage}</p> : null}

        <a href="/" style={linkStyle}>Already have an account? Sign in</a>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const pageStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  zIndex: 200
};

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  width: 380,
  maxWidth: "90vw",
  padding: "32px 28px",
  background: "rgba(30, 41, 59, 0.95)",
  border: "1px solid #334155",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 800,
  color: "#a3e635",
  textAlign: "center",
  letterSpacing: "0.02em"
};

const subtitleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 16,
  fontWeight: 400,
  color: "#94a3b8",
  textAlign: "center"
};

const infoStyle: CSSProperties = {
  margin: 0,
  padding: "10px 12px",
  fontSize: 14,
  color: "#e2e8f0",
  background: "rgba(163, 230, 53, 0.1)",
  borderRadius: 6,
  textAlign: "center"
};

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
  fontSize: 14,
  color: "#cbd5e1"
};

const inputStyle: CSSProperties = {
  padding: "8px 10px",
  fontSize: 14,
  background: "#0f172a",
  border: "1px solid #475569",
  borderRadius: 6,
  color: "#f1f5f9",
  outline: "none"
};

const primaryButtonStyle: CSSProperties = {
  marginTop: 4,
  padding: "10px 0",
  fontSize: 15,
  fontWeight: 600,
  background: "#65a30d",
  border: "none",
  borderRadius: 6,
  color: "#fff",
  cursor: "pointer"
};

const linkStyle: CSSProperties = {
  fontSize: 13,
  color: "#94a3b8",
  textAlign: "center",
  textDecoration: "underline"
};

const errorStyle: CSSProperties = {
  margin: 0,
  padding: "8px 10px",
  fontSize: 13,
  color: "#fda4af",
  background: "rgba(248,113,113,0.1)",
  borderRadius: 6
};
