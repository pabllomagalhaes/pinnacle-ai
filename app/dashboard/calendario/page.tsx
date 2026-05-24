import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Video } from "lucide-react";

export default async function CalendarPage() {
  const cookieStore = await cookies();
  const providerToken = cookieStore.get("google_provider_token")?.value;
  let events = [];

  if (providerToken) {
    const googleResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=15&singleEvents=true&orderBy=startTime`,
      { headers: { Authorization: `Bearer ${providerToken}` } }
    );
    if (googleResponse.ok) {
      const data = await googleResponse.json();
      events = data.items || [];
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Agenda de Estudos</h1>
      <div className="grid gap-4">
        {events.map((event: any) => (
          <Card key={event.id}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <CalendarIcon className="text-primary h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold">{event.summary}</h3>
                  <p className="text-sm text-muted-foreground">
                    {event.start?.dateTime ? new Date(event.start.dateTime).toLocaleString('pt-BR') : "Dia todo"}
                  </p>
                </div>
              </div>
              {event.hangoutLink && (
                <a href={event.hangoutLink} target="_blank" className="flex items-center gap-2 text-primary hover:underline font-medium">
                  <Video className="h-5 w-5" /> Abrir Meet
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}