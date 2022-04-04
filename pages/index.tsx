import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return session ? (
    <div>
      <p>Test</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  ) : (
    <div>
      <p>Test</p>
      <button onClick={() => signIn("github")}>Sign In</button>
    </div>
  );
}
