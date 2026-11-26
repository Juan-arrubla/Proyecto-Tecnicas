package conexionurrao.tecnicas.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import conexionurrao.tecnicas.model.EquipmentxSubscription;
import conexionurrao.tecnicas.repository.equipmentRepository;
import conexionurrao.tecnicas.repository.equipmentXSubscriptionRepository;
import conexionurrao.tecnicas.repository.subscriptionRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.List;



@RestController 
@RequestMapping("/api/equipment-subscriptions")


public class equipmentXSubscriptionController {
    private equipmentRepository equipmentRepository;
    private subscriptionRepository subscriptionRepository;
    private equipmentXSubscriptionRepository equipmentXSubscriptionRepository;

    public equipmentXSubscriptionController(equipmentRepository equipmentRepository, subscriptionRepository subscriptionRepository, equipmentXSubscriptionRepository equipmentXSubscriptionRepository){
        this.equipmentRepository=equipmentRepository;
        this.subscriptionRepository=subscriptionRepository;
        this.equipmentXSubscriptionRepository=equipmentXSubscriptionRepository;
    }
    @GetMapping
    //El required = false me indica que subscriptionId no es obligatorio, el metodo actua de 2 formas distintas
    public List<EquipmentxSubscription> getAll(@RequestParam(required = false) Integer subscriptionId) {

        //Si no mandaron subscriptionId, devolver todas las asignaciones
        if (subscriptionId == null) {
            return equipmentXSubscriptionRepository.findAll();
        }

        //Si lo mandaron, devolver solo las de esa suscripción
        return equipmentXSubscriptionRepository.findBySubscriptionSubscriptionId(subscriptionId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EquipmentxSubscription assign(@RequestBody EquipmentxSubscription assignment) {

        // Sacar los dos ids que vienen adentro
        Integer subscriptionId = assignment.getSubscription().getSubscriptionId();
        Integer code = assignment.getEquipment().getCode();

        // Revisar que la suscripción exista
        if (!subscriptionRepository.existsById(subscriptionId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La suscripción no existe");
        }

        //Revisar que el equipo exista en el catálogo
        if (!equipmentRepository.existsById(code)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El equipo no existe");
        }

        //Borrar el id para que save() haga un INSERT
        assignment.setEquipmentSubscriptionId(null);

        // Guardar
        EquipmentxSubscription saved = equipmentXSubscriptionRepository.save(assignment);
        return saved;
    }
    @DeleteMapping("/{id}")
    public void remove(@PathVariable Integer id) {

        if (!equipmentXSubscriptionRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Asignación no encontrada");
        }

        equipmentXSubscriptionRepository.deleteById(id);
    }


}
