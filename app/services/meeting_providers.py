import uuid
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any

logger = logging.getLogger(__name__)

class BaseMeetingProvider(ABC):
    """
    Abstract strategy class for all meeting providers.
    """
    @abstractmethod
    def create_meeting(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates a meeting and returns provider-specific details.
        Expected return format:
        {
            "meeting_url": str,
            "external_event_id": str | None,
            "room_id": str | None,
            "provider": str
        }
        """
        pass

    @abstractmethod
    def cancel_meeting(self, external_event_id: str) -> bool:
        """
        Cancels the meeting on the provider's platform.
        """
        pass


class OpenMeetingProvider(BaseMeetingProvider):
    """
    Open Meeting implementation using Jitsi.
    No login required, generates a unique public URL.
    """
    def create_meeting(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        room_id = f"dca-revops-{uuid.uuid4().hex[:12]}"
        meeting_url = f"https://meet.jit.si/{room_id}"
        logger.info(f"Generated Open Meeting (Jitsi) URL: {meeting_url}")
        
        return {
            "meeting_url": meeting_url,
            "external_event_id": None,
            "room_id": room_id,
            "provider": "open"
        }
        
    def cancel_meeting(self, external_event_id: str) -> bool:
        # Jitsi rooms are ephemeral; no explicit cancellation API required.
        return True


class GoogleMeetProvider(BaseMeetingProvider):
    """
    Google Meet implementation via Google Calendar API.
    """
    def create_meeting(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        # TODO: Integrate actual google-api-python-client calendar insert call here
        logger.info("Simulating Google Calendar API integration...")
        event_id = f"gcal_{uuid.uuid4().hex[:16]}"
        meeting_url = f"https://meet.google.com/{uuid.uuid4().hex[:3]}-{uuid.uuid4().hex[:4]}-{uuid.uuid4().hex[:3]}"
        
        return {
            "meeting_url": meeting_url,
            "external_event_id": event_id,
            "room_id": None,
            "provider": "google"
        }

    def cancel_meeting(self, external_event_id: str) -> bool:
        # TODO: Integrate actual google-api-python-client calendar delete call
        logger.info(f"Simulating Google Calendar event cancellation for {external_event_id}")
        return True


class ZoomProvider(BaseMeetingProvider):
    """
    Zoom Meeting implementation via Zoom API.
    """
    def create_meeting(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        # TODO: Integrate actual Zoom API (Server-to-Server OAuth) request
        logger.info("Simulating Zoom API integration...")
        meeting_id = f"{uuid.uuid4().int}"[:10] 
        meeting_url = f"https://zoom.us/j/{meeting_id}?pwd={uuid.uuid4().hex[:8]}"
        
        return {
            "meeting_url": meeting_url,
            "external_event_id": meeting_id,
            "room_id": meeting_id,
            "provider": "zoom"
        }

    def cancel_meeting(self, external_event_id: str) -> bool:
        logger.info(f"Simulating Zoom meeting cancellation for {external_event_id}")
        return True


class TeamsProvider(BaseMeetingProvider):
    """
    Microsoft Teams implementation via MS Graph API.
    """
    def create_meeting(self, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        # TODO: Integrate actual MS Graph API onlineMeetings request
        logger.info("Simulating Microsoft Teams API integration...")
        event_id = f"teams_{uuid.uuid4().hex[:20]}"
        meeting_url = f"https://teams.microsoft.com/l/meetup-join/19%3ameeting_{uuid.uuid4().hex}"
        
        return {
            "meeting_url": meeting_url,
            "external_event_id": event_id,
            "room_id": None,
            "provider": "teams"
        }

    def cancel_meeting(self, external_event_id: str) -> bool:
        logger.info(f"Simulating MS Teams meeting cancellation for {external_event_id}")
        return True


class MeetingProviderService:
    """
    Service context that delegates to the appropriate provider strategy.
    """
    def __init__(self):
        self._providers = {
            "open": OpenMeetingProvider(),
            "google": GoogleMeetProvider(),
            "zoom": ZoomProvider(),
            "teams": TeamsProvider()
        }

    def generate_meeting(self, provider_type: str, booking_details: Dict[str, Any]) -> Dict[str, Any]:
        provider = self._providers.get(provider_type.lower())
        if not provider:
            logger.warning(f"Provider '{provider_type}' not found. Falling back to 'open'.")
            provider = self._providers["open"]
            
        return provider.create_meeting(booking_details)

    def cancel_meeting(self, provider_type: str, external_event_id: str) -> bool:
        if not external_event_id:
            return True
            
        provider = self._providers.get(provider_type.lower())
        if provider:
            return provider.cancel_meeting(external_event_id)
        return False
