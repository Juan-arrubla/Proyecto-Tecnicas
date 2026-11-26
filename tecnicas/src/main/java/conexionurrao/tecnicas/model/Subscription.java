package conexionurrao.tecnicas.model;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
@Entity 
@Table (name="subscriptions")

public class Subscription {
    @Id 
    @GeneratedValue (strategy=GenerationType.IDENTITY)
    private  Integer subscriptionId;
    private Integer price;
    private String address;
    private String status;
    private LocalDate subscriptionDate;

    // Foreign Keys
@ManyToOne 
@JoinColumn (name="customer_id")
private Customer customer;

@ManyToOne
@JoinColumn  (name="plan_id")
private internetPlan plan;

public Subscription(){

}
public Subscription(Integer price, String address,String status,LocalDate subscriptionDate, Customer customer, internetPlan internetPlan){
    this.price=price;
    this.address=address;
    this.status=status;
    this.subscriptionDate=subscriptionDate;
    this.customer=customer;
    this.plan=internetPlan;

}
public Integer getSubscriptionId() {
    return subscriptionId;
}
public void setSubscriptionId(Integer subscriptionId) {
    this.subscriptionId = subscriptionId;
}
public Integer getPrice() {
    return price;
}
public void setPrice(Integer price) {
    this.price = price;
}
public String getAddress() {
    return address;
}
public void setAddress(String address) {
    this.address = address;
}
public String getStatus() {
    return status;
}
public void setStatus(String status) {
    this.status = status;
}
public LocalDate getSubscriptionDate() {
    return subscriptionDate;
}
public void setSubscriptionDate(LocalDate subscriptionDate) {
    this.subscriptionDate = subscriptionDate;
}
public Customer getCustomer() {
    return customer;
}
public void setCustomer(Customer customer) {
    this.customer = customer;
}
public internetPlan getPlan() {
    return plan;
}
public void setPlan(internetPlan plan) {
    this.plan = plan;
}




    
}
