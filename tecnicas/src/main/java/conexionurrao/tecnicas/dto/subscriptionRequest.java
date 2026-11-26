package conexionurrao.tecnicas.dto;

import conexionurrao.tecnicas.model.Customer;


/*Esta clase recibe las solicitudes del formulario simplemente, fue necesario crearla ya que las solicitudes requieren otros campos
y estos son distintos a cualquier otra clase creada previemante, se llama una Data Trasfer Object o DTO
 */
public class subscriptionRequest {
    private boolean newCustomer;
    private Customer customer;
    private Integer planId;
    private String address;

    public boolean isNewCustomer() {
        return newCustomer;
    }

    public void setNewCustomer(boolean newCustomer) {
        this.newCustomer = newCustomer;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public Integer getPlanId() {
        return planId;
    }

    public void setPlanId(Integer planId) {
        this.planId = planId;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public subscriptionRequest(){
        
    }

}
