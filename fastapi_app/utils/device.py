from user_agents import parse


def get_device_details(request):
    # FastAPI way
    ua_string = request.headers.get("user-agent", "")
    user_agent = parse(ua_string)

    ip_address = request.client.host if request.client else None

    device_name = "Unknown Device"

    if user_agent.is_mobile:
        device_name = f"{user_agent.device.family} Mobile"
    elif user_agent.is_tablet:
        device_name = f"{user_agent.device.family} Tablet"
    elif user_agent.is_pc:
        device_name = "Desktop"

    return {
        "ip_address": ip_address,
        "user_agent": ua_string,
        "device_name": device_name,
        "browser": user_agent.browser.family,
        "os": user_agent.os.family,
    }