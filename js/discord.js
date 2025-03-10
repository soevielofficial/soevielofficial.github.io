const discordStatusElement = document.getElementById('discord-status');

async function fetchDiscordStatus() {
    try {
        const response = await fetch('https://api.lanyard.rest/v1/users/442224069899976707');
        const data = await response.json();
        if (data.data) {
            updateStatusDot(data.data);
        } else {
            console.error('No data found');
        }
    } catch (error) {
        console.error('Error fetching Discord status:', error);
    }
}

function updateStatusDot(data) {
    if (data.discord_status === 'online') {
        discordStatusElement.style.backgroundColor = 'green';
    } else if (data.discord_status === 'idle') {
        discordStatusElement.style.backgroundColor = 'orange';
    } else if (data.discord_status === 'dnd') {
        discordStatusElement.style.backgroundColor = 'red';
    } else {
        discordStatusElement.style.backgroundColor = 'gray';
    }
}

setInterval(fetchDiscordStatus, 2000); 
fetchDiscordStatus();