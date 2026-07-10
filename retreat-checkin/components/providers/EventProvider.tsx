"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Event } from "@/types";
import { firestoreService } from "@/lib/services/firestore";

interface EventContextType {
  selectedEvent: Event | null;
  events: Event[];
  loadingEvents: boolean;
  selectEvent: (event: Event) => void;
  clearEvent: () => void;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType>({
  selectedEvent: null,
  events: [],
  loadingEvents: true,
  selectEvent: () => {},
  clearEvent: () => {},
  refreshEvents: async () => {},
});

export const useEvent = () => useContext(EventContext);

export const EventProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  const refreshEvents = async () => {
    setLoadingEvents(true);
    try {
      const fetchedEvents = await firestoreService.getEvents();
      
      // If there are no events in Firestore, let's create a default one for now to avoid breaking the app
      if (fetchedEvents.length === 0) {
        const defaultEvent = { id: "default-event", name: "Default Event" };
        await firestoreService.set("events", defaultEvent.id, defaultEvent);
        setEvents([defaultEvent]);
      } else {
        setEvents(fetchedEvents);
        setSelectedEvent(prev => {
          if (!prev) return prev;
          const updated = fetchedEvents.find(e => e.id === prev.id);
          if (updated) {
            localStorage.setItem("selectedEvent", JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    refreshEvents();
  }, []);

  const selectEvent = (event: Event) => {
    setSelectedEvent(event);
    localStorage.setItem("selectedEvent", JSON.stringify(event));
  };

  const clearEvent = () => {
    setSelectedEvent(null);
    localStorage.removeItem("selectedEvent");
  };

  return (
    <EventContext.Provider value={{
      selectedEvent,
      events,
      loadingEvents,
      selectEvent,
      clearEvent,
      refreshEvents
    }}>
      {children}
    </EventContext.Provider>
  );
};
