package conexionurrao.tecnicas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity 
@Table(name="equipment_subscription")

public class EquipmentxSubscription {
    @Id 
    @GeneratedValue (strategy=GenerationType.IDENTITY)
    private Integer equipmentSubscriptionId;

    @ManyToOne 
    @JoinColumn (name="subscription_id")
    private Subscription subscription;

    @ManyToOne 
    @JoinColumn (name="code")
    private equipment equipment;

    public Subscription getSubscription() {
        return subscription;
    }
    public void setSubscription(Subscription subscription) {
        this.subscription = subscription;
    }
    public equipment getEquipment() {
        return equipment;
    }
    public void setEquipment(equipment equipment) {
        this.equipment = equipment;
    }
    public Integer getEquipmentSubscriptionId() {
        return equipmentSubscriptionId;
    }
    public void setEquipmentSubscriptionId(Integer equipmentSubscriptionId) {
        this.equipmentSubscriptionId = equipmentSubscriptionId;
    }
   
    
    public EquipmentxSubscription(){

    }
    public EquipmentxSubscription(Integer equipmentSubscriptionId,Subscription subscription,equipment equipment){
        this.equipmentSubscriptionId= equipmentSubscriptionId;
        this.subscription= subscription;
        this.equipment=equipment;

    }

}
