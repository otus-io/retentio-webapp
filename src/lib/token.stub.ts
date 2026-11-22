/** `#server-token` outside the react-server layer: client code never sees the httpOnly JWT. */
export async function getToken(): Promise<string | null> {
  return null
}
