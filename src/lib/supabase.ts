import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    "https://krkpbvedmogsygknjqrx.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtya3BidmVkbW9nc3lna25qcXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMDIwODAsImV4cCI6MjA5NDY3ODA4MH0.U80KkQWLyIaPgnxacF-539E_49aSpjE0m98R7HiqNFY",
  );
}
