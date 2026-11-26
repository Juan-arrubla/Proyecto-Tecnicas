package conexionurrao.tecnicas.model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity 
@Table(name="internet_plan")
public class internetPlan {

    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Integer planId;
    private String name;
    @Column(name = "connection_speed")
    private Integer connectionSpeed;
    private Integer price;
    private String image;
    @Column(columnDefinition = "TINYINT(1)")
    private boolean active;

    public internetPlan(){
    }

    public internetPlan(String name,Integer connectionSpeed, Integer price, String image,boolean active){
        this.name= name;
        this.connectionSpeed=connectionSpeed;
        this.price=price;
        this.image=image;
        this.active=active;
    }

    public Integer getPlanId() {
        return planId;
    }

    public void setPlanId(Integer planID) {
        this.planId = planID;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getConnectionSpeed() {
        return connectionSpeed;
    }

    public void setConnectionSpeed(Integer connectionSpeed) {
        this.connectionSpeed = connectionSpeed;
    }

    public Integer getPrice() {
        return price;
    }

    public void setPrice(Integer price) {
        this.price = price;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
    


    


    
}
