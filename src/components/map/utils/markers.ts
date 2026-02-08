import { NightlifeVenue } from '@/lib/nightlifeApi';
import { PartyEvent } from '@/lib/partyApi';

export const createMarkerElement = (type: 'pickup' | 'destination') => {
    const el = document.createElement('div');
    el.style.cssText = 'width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;';
    const isPickup = type === 'pickup';
    const bgColor = isPickup ? '#00D9FF' : '#22C55E';
    const icon = isPickup ? '📍' : '🎯';
    el.innerHTML = `
    <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${bgColor}30; animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
    <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: ${bgColor}50;"></div>
    <div style="position: relative; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); background: linear-gradient(135deg, ${bgColor}, ${isPickup ? '#0099CC' : '#16A34A'}); color: white; border: 2px solid rgba(255,255,255,0.2);">
      ${icon}
    </div>
  `;
    return el;
};

export const createUserLocationMarkerElement = () => {
    const el = document.createElement('div');
    el.style.cssText = 'width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;';
    el.innerHTML = `
    <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: #00D9FF20; animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;"></div>
    <div style="position: absolute; width: 16px; height: 16px; border-radius: 50%; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"></div>
    <div style="position: absolute; width: 12px; height: 12px; border-radius: 50%; background: #00D9FF;"></div>
  `;
    return el;
};

export const createWifiMarkerElement = () => {
    const el = document.createElement('div');
    el.style.cssText = 'width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    el.innerHTML = `
    <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: #00D9FF20; border: 1px solid #00D9FF40; backdrop-blur: 4px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: all 0.2s ease;">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
    </div>
  `;

    el.onmouseenter = () => {
        const child = el.firstElementChild as HTMLElement;
        if (child) {
            child.style.transform = 'scale(1.2)';
            child.style.backgroundColor = '#00D9FF40';
            child.style.borderColor = '#00D9FF';
        }
    };

    el.onmouseleave = () => {
        const child = el.firstElementChild as HTMLElement;
        if (child) {
            child.style.transform = 'scale(1)';
            child.style.backgroundColor = '#00D9FF20';
            child.style.borderColor = '#00D9FF40';
        }
    };

    return el;
};

export const createNightlifeMarkerElement = (venue: NightlifeVenue) => {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 0; height: 0; overflow: visible;';

    const pill = document.createElement('div');
    pill.style.cssText = `
    background-color: #0f1115;
    color: white;
    padding: 6px 10px;
    border-radius: 20px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.15);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s;
    z-index: 10;
    transform-origin: center center;
    white-space: nowrap;
    `;

    pill.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
    <span>${venue.rating.toFixed(1)}</span>
    `;

    pill.onmouseenter = () => {
        pill.style.transform = 'scale(1.15) translateY(-2px)';
        pill.style.backgroundColor = '#000000';
        pill.style.borderColor = 'white';
        pill.style.zIndex = '50';
    };

    pill.onmouseleave = () => {
        pill.style.transform = 'scale(1) translateY(0)';
        pill.style.backgroundColor = '#0f1115';
        pill.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        pill.style.zIndex = '10';
    };

    container.appendChild(pill);
    return container;
};

export const createEventMarkerElement = (event: PartyEvent) => {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; align-items: center; justify-content: center; width: 0; height: 0; overflow: visible;';

    const pill = document.createElement('div');
    pill.style.cssText = `
    background-color: #1a1c23;
    color: white;
    padding: 4px 10px 4px 4px;
    border-radius: 20px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    cursor: pointer;
    border: 1px solid rgba(124, 58, 237, 0.4);
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 20;
    transform-origin: center center;
    white-space: nowrap;
    `;

    const imageUrl = event.image?.url || 'https://images.unsplash.com/photo-1514525253361-bee8d40d04a6?w=100&q=80';
    pill.innerHTML = `
    <div style="width: 24px; height: 24px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(167, 139, 250, 0.5);">
        <img src="${imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
    <span style="color: #A78BFA; text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px;">EVENT</span>
    `;

    pill.onmouseenter = () => {
        pill.style.transform = 'scale(1.1) translateY(-2px)';
        pill.style.backgroundColor = '#252831';
        pill.style.borderColor = '#7C3AED';
        pill.style.zIndex = '60';
    };

    pill.onmouseleave = () => {
        pill.style.transform = 'scale(1) translateY(0)';
        pill.style.backgroundColor = '#1a1c23';
        pill.style.borderColor = 'rgba(124, 58, 237, 0.4)';
        pill.style.zIndex = '20';
    };

    container.appendChild(pill);
    return container;
};
