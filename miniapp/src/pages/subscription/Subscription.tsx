// src/pages/subscription/SubscriptionPage.tsx
import React, { useState, useEffect } from "react";
import { Header } from "../../components/Header";
import BackButton from "../../components/BackButton";
import { Button } from "../../components/Button";

const SubscriptionPage: React.FC = ({ telegramId }: { telegramId?: string }) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загрузка данных о подписке
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch(`/api/subscription/status?telegramId=${telegramId}`);
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    // Создание платежной сессии
    const response = await fetch('/api/subscription/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: telegramId })
    });
    
    const { paymentUrl } = await response.json();
    // Перенаправление на страницу оплаты
    window.open(paymentUrl, '_blank');
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <>
      <Header title="Подписка" />
      
      <div style={{ padding: 16 }}>
        <BackButton />
        
        {/* Статус подписки */}
        <div style={{
          padding: 20,
          borderRadius: 12,
          background: subscription?.status === 'active' ? '#E8F5E9' : '#FFF3E0',
          marginTop: 16,
          border: `2px solid ${subscription?.status === 'active' ? '#4CAF50' : '#FF9800'}`
        }}>
          <h3 style={{ marginTop: 0 }}>
            {subscription?.status === 'active' ? '✅ Активная подписка' : '🆓 Бесплатный тариф'}
          </h3>
          
          {subscription?.status === 'active' ? (
            <>
              <p>Следующее списание: {subscription.nextPaymentDate}</p>
              <p>Тариф: Премиум ({subscription.subscriptionType})</p>
              <Button type="secondary" onClick={() => {/* Управление подпиской */}}>
                Управление
              </Button>
            </>
          ) : (
            <>
              <p>Доступны базовые функции</p>
              <Button type="primary" onClick={handleUpgrade}>
                Перейти на Премиум — 499₽/мес
              </Button>
            </>
          )}
        </div>

        {/* Сравнение тарифов */}
        <div style={{ marginTop: 32 }}>
          <h3>Сравнение тарифов</h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 16,
            marginTop: 16
          }}>
            {/* Бесплатный тариф */}
            <div style={{
              padding: 20,
              borderRadius: 12,
              background: '#F5F5F5',
              border: '2px solid #9E9E9E'
            }}>
              <h4>Бесплатный</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>0₽</p>
              <ul style={{ paddingLeft: 20 }}>
                <li>3 записи в день</li>
                <li>Статистика за 7 дней</li>
                <li>Базовые графики</li>
                <li>2 напоминания в день</li>
              </ul>
            </div>

            {/* Премиум тариф */}
            <div style={{
              padding: 20,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: '2px solid #764ba2'
            }}>
              <h4>Премиум</h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold' }}>499₽/мес</p>
              <ul style={{ paddingLeft: 20 }}>
                <li>∞ записей в день</li>
                <li>Полная статистика</li>
                <li>Расширенные графики</li>
                <li>Экспорт данных</li>
                <li>Индивидуальные напоминания</li>
                <li>Приоритетная поддержка</li>
              </ul>
              <Button 
                type="primary" 
                onClick={handleUpgrade}
                style={{ 
                  background: 'white', 
                  color: '#764ba2',
                  marginTop: 16,
                  width: '100%'
                }}
              >
                Перейти на Премиум
              </Button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 32 }}>
          <h3>Частые вопросы</h3>
          <div style={{ marginTop: 16 }}>
            <details style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
              <summary>Как отменить подписку?</summary>
              <p>Вы можете отменить подписку в любое время в разделе "Управление подпиской".</p>
            </details>
            <details style={{ marginBottom: 12, padding: 12, border: '1px solid #ddd', borderRadius: 8 }}>
              <summary>Будет ли возврат денег?</summary>
              <p>Мы возвращаем деньги в течение 14 дней после покупки, если вы не пользовались премиум функциями.</p>
            </details>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionPage;
