package conexionurrao.tecnicas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;


@Entity 
@Table(name="promotion")

public class Promotion {
    @Id 
    @GeneratedValue(strategy=GenerationType.IDENTITY)
    private Integer promotionId;
    private String name;
    private Integer discountPercentage;
    private LocalDate startingDate;
    private LocalDate finalDate;
    private String image;
    
    public Integer getPromotionId() {
        return promotionId;
    }
    public void setPromotionId(Integer promotionId) {
        this.promotionId = promotionId;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public Integer getDiscountPercentage() {
        return discountPercentage;
    }
    public void setDiscountPercentage(Integer discountPercentage) {
        this.discountPercentage = discountPercentage;
    }
    public LocalDate getStartingDate() {
        return startingDate;
    }
    public void setStartingDate(LocalDate startingDate) {
        this.startingDate = startingDate;
    }
    public LocalDate getFinalDate() {
        return finalDate;
    }
    public void setFinalDate(LocalDate finalDate) {
        this.finalDate = finalDate;
    }
    public String getImage() {
        return image;
    }
    public void setImage(String image) {
        this.image = image;
    }
    public Promotion(){

    }
    public Promotion(Integer promotionId, String name, Integer discountPercentage, LocalDate startingDate,
            LocalDate finalDate, String image) {
        this.promotionId = promotionId;
        this.name = name;
        this.discountPercentage = discountPercentage;
        this.startingDate = startingDate;
        this.finalDate = finalDate;
        this.image = image;
    }



}
