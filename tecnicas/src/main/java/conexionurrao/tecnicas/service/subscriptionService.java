package conexionurrao.tecnicas.service;

import java.time.LocalDate;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import conexionurrao.tecnicas.dto.subscriptionRequest;
import conexionurrao.tecnicas.model.Customer;
import conexionurrao.tecnicas.model.Promotion;
import conexionurrao.tecnicas.model.Subscription;
import conexionurrao.tecnicas.repository.PromotionRepository;
import conexionurrao.tecnicas.repository.customerRepository;
import conexionurrao.tecnicas.repository.internetPlanRepository;
import conexionurrao.tecnicas.repository.subscriptionRepository;
import jakarta.transaction.Transactional;
import conexionurrao.tecnicas.model.internetPlan;

@Service 
public class subscriptionService {
    private final customerRepository customerRepository;
    private final internetPlanRepository internetPlanRepository;
    private final PromotionRepository PromotionRepository;
    private final subscriptionRepository subscriptionRepository;

    //Inyeccion de dependencias de los metodos que se comunican con las tablas de la base de datos
    public subscriptionService(customerRepository customerRepository,internetPlanRepository internetPlanRepository,PromotionRepository PromotionRepository,subscriptionRepository subscriptionRepository){
        this.customerRepository=customerRepository;
        this.internetPlanRepository=internetPlanRepository;
        this.PromotionRepository=PromotionRepository;
        this.subscriptionRepository=subscriptionRepository;
    }
    @Transactional  // Esta etiqueta permite que si algo falla en mitad del proceso, se deshace todo el proceso
    public Subscription createRequest(subscriptionRequest request){
        Customer data= request.getCustomer();
        if (data== null || data.getCustomerId()== null){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cédula es obligatoria");
        }

        
        Customer customer;
        if (request.isNewCustomer()== true){  //Si la solicitud pasa este filtro estamos en presencia de un cliente nuevo
            if (customerRepository.existsById(data.getCustomerId())){
                throw new ResponseStatusException(HttpStatus.CONFLICT,"La cedula ya esta registrada, usa la opcion 'Ya me he suscrito antes'");
            }
            customer=customerRepository.save(data);  // Si todo sale bien, el cliente se crea en la base de datos
        
        }else {
            //Buscar en la tabla al cliente con esa cédula
            Optional<Customer> found = customerRepository.findById(data.getCustomerId());

            // Si no hay ningún cliente con esa cédula, los datos no coinciden
            if (found.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Los datos no coinciden con ningún cliente");
            }

            customer = found.get();

            // Comparar el correo guardado en ese cliente con el que escribió la persona
            String savedEmail = customer.getEmail();
            String typedEmail = data.getEmail();

            if (!savedEmail.equalsIgnoreCase(typedEmail)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Los datos no coinciden con ningún cliente");
            }
        }
        // Verificaciones del plan de internet, El plan existe? El plan esta activo?
        internetPlan plan = internetPlanRepository.findById(request.getPlanId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "El plan no existe"));
        
        if (!plan.isActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El plan que escogiste ya no está disponible");
        }

        // Esta linea de codigo saca la fecha de hoy
        LocalDate today = LocalDate.now();

        // Buscar una promoción que ya haya empezado y que todavía no haya terminado
        Optional<Promotion> foundPromo = PromotionRepository.findFirstByStartingDateLessThanEqualAndFinalDateGreaterThanEqual(today, today);

        // Si no hay promoción, el descuento es 0
        int discount = 0;

        // Si hay una, se usa su porcentaje
        if (!foundPromo.isEmpty()) {
            Promotion promo = foundPromo.get();
            discount = promo.getDiscountPercentage();
        }


        //Si todo funciona bien se crea y guarda la suscripcion
        int price = plan.getPrice() * (100 - discount) / 100;

        Subscription subscription = new Subscription(price,request.getAddress(),"pendiente",LocalDate.now(),customer,plan);
        
        return subscriptionRepository.save(subscription);

    


        
        

    }



}
