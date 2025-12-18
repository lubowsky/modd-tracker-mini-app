import React, { useEffect } from "react";
import { Button } from "../../components/Button";
import { useSubscriptionStore } from "../../store/subscriptionStore";
import { Header } from "../../components/Header";

const Subscription: React.FC = () => {
  const { subscription, loadSubscription, pay } = useSubscriptionStore();

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  return (
    <>
       <Header title="Подписка" />
       <div style={{ padding: 20 }}>
      {!subscription ? (
        "Загрузка…"
      ) : (
        <>
          <p>
            Статус: {subscription.active ? "Активна" : "Неактивна"}
          </p>
          {subscription.active && (
            <p>Действует до: {subscription.expiresAt}</p>
          )}
        </>
      )}

      <Button onClick={pay}>Оплатить / Продлить</Button>
    </div>
    </>
 
  );
};

export default Subscription;
