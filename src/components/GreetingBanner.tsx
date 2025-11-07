import React, { useState, useEffect } from 'react';
import './GreetingBanner.css';

interface GreetingBannerProps {
  userName?: string;
}

const GreetingBanner: React.FC<GreetingBannerProps> = ({ userName }) => {
  const [greeting, setGreeting] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const greetings = {
    morning: [
      { greeting: 'Good morning', message: 'Have a productive and efficient day!' },
      { greeting: 'Good morning', message: 'Start your day with positive energy!' },
      { greeting: 'Good morning', message: 'Wishing you a wonderful working day!' },
      { greeting: 'Good morning', message: 'May you accomplish all your goals today!' },
      { greeting: 'Good morning', message: 'Have a great day ahead!' },
      { greeting: 'Morning!', message: 'Let\'s make today count!' },
    ],
    afternoon: [
      { greeting: 'Good afternoon', message: 'Have an efficient and enjoyable afternoon!' },
      { greeting: 'Good afternoon', message: 'Keep up the momentum for the rest of the day!' },
      { greeting: 'Good afternoon', message: 'Wishing you a successful completion of today\'s work!' },
      { greeting: 'Good afternoon', message: 'Stay optimistic and energetic!' },
      { greeting: 'Good afternoon', message: 'Keep pushing forward!' },
    ],
    evening: [
      { greeting: 'Good evening', message: 'Have a relaxing and restful evening!' },
      { greeting: 'Good evening', message: 'Thank you for working hard today!' },
      { greeting: 'Good evening', message: 'Wish you a good rest and recharge your energy!' },
      { greeting: 'Good evening', message: 'Relax and enjoy your rest time!' },
      { greeting: 'Good evening', message: 'Great job today!' },
    ],
    night: [
      { greeting: 'Good night', message: 'It\'s late, remember to get enough rest!' },
      { greeting: 'Good night', message: 'Sleep well and have sweet dreams!' },
      { greeting: 'Good night', message: 'Take a break to prepare for tomorrow!' },
      { greeting: 'Good night', message: 'Time to recharge for a new day!' },
    ],
  };

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let timeOfDay: keyof typeof greetings;
      let selectedGreetings;

      if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning';
        selectedGreetings = greetings.morning;
      } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'afternoon';
        selectedGreetings = greetings.afternoon;
      } else if (hour >= 17 && hour < 22) {
        timeOfDay = 'evening';
        selectedGreetings = greetings.evening;
      } else {
        timeOfDay = 'night';
        selectedGreetings = greetings.night;
      }

      // Chọn ngẫu nhiên một greeting từ danh sách
      const randomIndex = Math.floor(Math.random() * selectedGreetings.length);
      const selected = selectedGreetings[randomIndex];
      
      setGreeting(selected.greeting);
      setMessage(selected.message);
    };

    // Cập nhật ngay lập tức
    updateGreeting();

    // Cập nhật lại mỗi giờ
    const interval = setInterval(updateGreeting, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const displayName = userName ? userName.split(' ')[0] : 'there';

  return (
    <div className="greeting-banner">
      <div className="greeting-content">
        <div className="greeting-icon">
          <span role="img" aria-label="wave">👋</span>
        </div>
        <div className="greeting-text">
          <div className="greeting-main">
            {greeting}, <span className="user-name">{displayName}</span>!
          </div>
          <div className="greeting-message">{message}</div>
        </div>
      </div>
    </div>
  );
};

export default GreetingBanner;

