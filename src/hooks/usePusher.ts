"use client";
import { useEffect } from "react";
import Pusher from "pusher-js";

let pusherClient: Pusher | null = null;
const channelListeners: { [channelName: string]: number } = {};

function getPusherClient() {
  if (!pusherClient) {
    Pusher.logToConsole = true;
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
  }
  return pusherClient;
}

export function usePusher(channelName: string, eventName: string, callback: (data: any) => void) {
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);
    
    channel.bind(eventName, callback);
    
    if (!channelListeners[channelName]) {
      channelListeners[channelName] = 0;
    }
    channelListeners[channelName]++;

    return () => {
      channel.unbind(eventName, callback);
      channelListeners[channelName]--;
      
      if (channelListeners[channelName] <= 0) {
        pusher.unsubscribe(channelName);
        delete channelListeners[channelName];
      }
    };
  }, [channelName, eventName, callback]);
}
