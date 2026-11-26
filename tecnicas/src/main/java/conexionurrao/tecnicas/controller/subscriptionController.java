package conexionurrao.tecnicas.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import conexionurrao.tecnicas.dto.subscriptionRequest;
import conexionurrao.tecnicas.model.Subscription;
import conexionurrao.tecnicas.repository.customerRepository;
import conexionurrao.tecnicas.repository.internetPlanRepository;
import conexionurrao.tecnicas.repository.subscriptionRepository;
import conexionurrao.tecnicas.service.subscriptionService;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;


@RestController 
@RequestMapping ("/api/subscriptions")
public class subscriptionController {
    private final subscriptionRepository subscriptionRepository;
    private final subscriptionService subscriptionService;
    private final customerRepository customerRepository;
    private final internetPlanRepository internetPlanRepository;

    public subscriptionController(subscriptionRepository subscriptionRepository,subscriptionService subscriptionService,customerRepository customerRepository,internetPlanRepository internetPlanRepository){
        this.subscriptionRepository=subscriptionRepository;
        this.subscriptionService= subscriptionService;
        this.customerRepository=customerRepository;
        this.internetPlanRepository=internetPlanRepository;
        

    }
    
    @GetMapping
    //Hace que los parametros no sean obligatorios con required = false
    //Estos parametros hacen los filtros de las suscripciones
    public List<Subscription> getAll(@RequestParam(required = false) String status,@RequestParam(required = false) String from,@RequestParam(required = false) String to) {
                                    
        List<Subscription> allSubscriptions = subscriptionRepository.findAll();
        List<Subscription> result = new ArrayList<>();  //Arreglo que guarda las suscripciones que pasan los filtros

        for (Subscription subscription : allSubscriptions) {  

                //Empezamos suponiendo que cualquier suscripcion pasa los filtos y las vamos evaluando
                boolean passes = true;

                //Este filto lo que hace es que compara el status de la suscripcion mandado en el filto con el status de cada suscripcion, si son diferentes, se rechaza
                if (status != null && !status.isEmpty()) {
                    if (!subscription.getStatus().equals(status)) {
                        passes = false;
                    }
                }

                
                LocalDate day = subscription.getSubscriptionDate();

                //El parametro "from" guarda la fecha de inicio del filtro
                //Si la suscripcion empezo antes de la fecha "from", entonces se rechaza
                if (from != null && !from.isEmpty()) {
                    LocalDate fromDate = LocalDate.parse(from);
                    if (day.isBefore(fromDate)) {
                        passes = false;
                    }
                }

                //La variable "to" guarda la fecha final del filtro
                //Si la suscripcion empezo despues de la fecha "to" se rechaza
                if (to != null && !to.isEmpty()) {
                    LocalDate toDate = LocalDate.parse(to);
                    if (day.isAfter(toDate)) {
                        passes = false;
                    }
                }

                //Si la suscripcion paso todos los filtros, entonces se guarda en la lista result
                if (passes==true) {
                    result.add(subscription);
                }
            }

        return result;
    }
    
    @PostMapping("/request")
    @ResponseStatus(HttpStatus.CREATED)
    public Subscription request(@RequestBody subscriptionRequest request) {
        Subscription created = subscriptionService.createRequest(request);
        return created;
}   
    @GetMapping("/{id}")
    public Subscription getById(@PathVariable Integer id) {
        if(!subscriptionRepository.existsById(id)){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"La suscripcion no existe");
        }
        Subscription subscription = subscriptionRepository.findById(id).get();
        return subscription;
    }
    /* Cuando se llena un registro desde el Panel admin, lo que se hace es que la pagina me devuelve un JSON, por eso
    es tan importante el @RequestBody , toma ese JSON y le dice que corresponde a un objeto de tal tipo
     */
    @PostMapping
    public Subscription create(@RequestBody Subscription subscription) {
        Integer planId=subscription.getPlan().getPlanId();
        Integer customerId=subscription.getCustomer().getCustomerId();

        //Verifica que el cliente exista
        if(!customerRepository.existsById(customerId)){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"El cliente no existe");
        }
        //Verifica que el plan exista
        if (!internetPlanRepository.existsById(planId)){
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"El plan no existe");
        }

        if (subscription.getSubscriptionDate() == null) {
        subscription.setSubscriptionDate(LocalDate.now());

    }
        //Aqui como en las demas clases, se borra el Id para forzar al .save que haga un Insert en lugar de un Update    
        subscription.setSubscriptionId(null);

        Subscription saved=subscriptionRepository.save(subscription);
        return saved;
        
    }
    @PutMapping("/{id}")
    public Subscription update(@PathVariable Integer id, @RequestBody Subscription subscription) {

        // Si no existe manda error
        if (!subscriptionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Suscripción no encontrada");
        }

        //Ponerle el id de la dirección para que save() haga un UPDATE
        subscription.setSubscriptionId(id);

        //Guardar
        Subscription saved = subscriptionRepository.save(subscription);
        return saved;
    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {

        if (!subscriptionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Suscripción no encontrada");
        }

        //Intentar borrar la suscripcion, si tiene equipos asignados no lo permite, primero se tienen que borrar los equipos
        try {
            subscriptionRepository.deleteById(id);
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No se puede eliminar: la suscripción tiene equipos asignados");
        }
    }
    
    
    

    

    

}
