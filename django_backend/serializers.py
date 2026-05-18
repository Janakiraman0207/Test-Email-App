from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Event, EventAttendee

User = get_user_model()


class EventAttendeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventAttendee
        fields = ["user", "status", "role"]


class EventSerializer(serializers.ModelSerializer):

    attendees = EventAttendeeSerializer(
        source="attendees",
        many=True,
        read_only=True
    )

    attendee_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = (
            "created_by",
            "created_at",
            "updated_at",
        )

    def validate(self, data):
        start = data.get("start_datetime")
        end = data.get("end_datetime")

        if start and end and end <= start:
            raise serializers.ValidationError(
                "End time must be after start time."
            )

        return data

    def create(self, validated_data):
        attendee_ids = validated_data.pop("attendee_ids", [])

        event = Event.objects.create(
            created_by=self.context["request"].user,
            **validated_data
        )

      
        EventAttendee.objects.create(
            event=event,
            user=self.context["request"].user,
            status="accepted",
            role="owner"
        )

        
        for uid in attendee_ids:
            if uid == self.context["request"].user.id:
                continue

            try:
                user = User.objects.get(id=uid)
                EventAttendee.objects.get_or_create(
                    event=event,
                    user=user,
                    defaults={"status": "pending", "role": "guest"}
                )
            except User.DoesNotExist:
                continue

        return event