document.addEventListener('DOMContentLoaded', () => {
  const currentTimeDisplay = document.getElementById('current-time');
  const scrollDownButton = document.querySelector('.scroll-down');
  const scrollUpButton = document.querySelector('.scroll-up');
  const bgImage = document.getElementById('bg-image');
  const tofServerContainer = document.querySelector('.tof-server');
  const slideWorkshopItems = document.querySelectorAll('.workshop-item');
  let workshopItemCurrentIndex = 0;

  const updateTime = () => {
    const now = new Date();
    currentTimeDisplay.textContent = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const startUpdateTime = () => {
    updateTime();
    setInterval(updateTime, 30000);
  };

  const scrollPage = (direction) => {
    const scrollAmount = window.innerHeight;
    window.scrollBy({
      top: direction === 'up' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const scrollDown = () => {
    if (bgImage) {
      bgImage.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollUp = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkScrollPosition = () => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const clientHeight = window.innerHeight;

    scrollDownButton.style.opacity = (scrollTop + clientHeight >= scrollHeight - 5) ? '0' : '1';
    scrollUpButton.style.opacity = (scrollTop > clientHeight / 2) ? '1' : '0';
  };

  const setupEventListeners = () => {
    window.addEventListener('hashchange', () => {
      window.history.pushState({}, '', '/');
    });

    window.addEventListener('scroll', checkScrollPosition);

    window.addEventListener('keydown', (event) => {
      if (event.key === 'PageUp' || event.key === 'ArrowUp') {
        scrollPage('up');
      } else if (event.key === 'PageDown' || event.key === 'ArrowDown') {
        scrollPage('down');
      }
    });

    scrollDownButton.addEventListener('click', scrollDown);
    scrollUpButton.addEventListener('click', scrollUp);
  };

  const fetchAndRenderServerData = () => {
    fetch('https://raw.githubusercontent.com/soevielofficial/tof-server/refs/heads/main/server.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        let title = '<h1 style="text-align: center;">Tower of Fantasy Server</h1>';
        let description = '<div style="text-align: justify;">This document provides a breakdown of Tower of Fantasy server locations and associated network information. It details the geographical distribution of servers across different regions (OS - Overseas, and CN - China), including IP addresses, hostnames, ISPs, and geographical coordinates.</div>';
        let output = '';

        output += '<h2>OS Servers</h2>';
        for (const region in data.os) {
          output += `<h3>${region}</h3><ul>`;
          const server = data.os[region];
          for (const key in server) {
            output += `<li>${key}: ${server[key]}</li>`;
          }
          output += '</ul>';
        }

        output += '<h2>CN Servers</h2>';
        for (const serverName in data.cn) {
          output += `<h3>${serverName}</h3><ul>`;
          const server = data.cn[serverName];
          for (const key in server) {
            output += `<li>${key}: ${server[key]}</li>`;
          }
          output += '</ul>';
        }

        tofServerContainer.innerHTML = title + description + output;
      })
      .catch((error) => {
        console.error('Error fetching server data:', error);
        tofServerContainer.innerHTML = '<p>An error occurred while loading server data. Please try again later.</p>';
      });
  };

  const showWorkshopItem = (index) => {
    slideWorkshopItems.forEach((item, i) => {
      item.classList.toggle('show', i === index);
    });
  };

  const cycleWorkshopItems = () => {
    workshopItemCurrentIndex = (workshopItemCurrentIndex + 1) % slideWorkshopItems.length;
    showWorkshopItem(workshopItemCurrentIndex);
  };

  const initialize = () => {
    startUpdateTime();
    setupEventListeners();
    checkScrollPosition();
    fetchAndRenderServerData();
    showWorkshopItem(workshopItemCurrentIndex);
    setInterval(cycleWorkshopItems, 2500);
  };

  initialize();
});