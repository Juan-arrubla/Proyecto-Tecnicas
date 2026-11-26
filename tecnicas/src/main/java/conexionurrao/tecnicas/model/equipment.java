package conexionurrao.tecnicas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="equipment") 
public class equipment {
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Integer code;
    private String name;
    private String brand;
    private Integer price;
    

    public equipment(){

    }
    public equipment(String name, String brand, Integer price){
        
        this.name= name;
        this.brand=brand;
        this.price=price;
    }
    //Setters y Getters
    
    
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getBrand() {
        return brand;
    }
    public void setBrand(String brand) {
        this.brand = brand;
    }
    public Integer getPrice() {
        return price;
    }
    public void setPrice(Integer price) {
        this.price = price;
    }
    public Integer getCode() {
        return code;
    }
    public void setCode(Integer code) {
        this.code = code;
    }
    

}
