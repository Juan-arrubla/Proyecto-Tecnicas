package conexionurrao.tecnicas.controller;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import conexionurrao.tecnicas.model.internetPlan;
import conexionurrao.tecnicas.repository.internetPlanRepository;


@RestController
@RequestMapping("/api/plans")

public class internetPlanController {
    private final internetPlanRepository internetPlanRepository;  //Declaramos el Atributo de tipo repositorio

    public internetPlanController(internetPlanRepository internetPlanRepository){  //Constructor
        this.internetPlanRepository=internetPlanRepository; //Inicializamos el atributo
    }

@GetMapping  //EndPoint Para obtener todos los planes, usado para listar los planes en el menu de admin
public List<internetPlan> getAll() {
    return internetPlanRepository.findAll();
}
@PostMapping        //EndPoint para crear Planes de internet
public internetPlan create(@RequestBody internetPlan plan) {
    plan.setPlanId(null);
    return internetPlanRepository.save(plan);
}

@GetMapping("/{id}")   //Endpoint para buscar un solo plan (api/plan/id), este endpoint si no encuentra nada lanza un error 404
public internetPlan getById(@PathVariable Integer id){
    return internetPlanRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado"));
}
@PutMapping("/{id}")  //EndPoint para actualizar un plan de internet, usa el Put
public internetPlan update(@PathVariable Integer id, @RequestBody internetPlan plan) {
    if (!internetPlanRepository.existsById(id)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado");
    }
    plan.setPlanId(id);
    return internetPlanRepository.save(plan);
}
@DeleteMapping("/{id}")
public void delete(@PathVariable Integer id) {
    internetPlan plan = internetPlanRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Plan no encontrado"));
    plan.setActive(false);
    internetPlanRepository.save(plan);
}
}
