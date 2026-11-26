package conexionurrao.tecnicas.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import conexionurrao.tecnicas.model.equipment;

import conexionurrao.tecnicas.repository.equipmentRepository;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController 
@RequestMapping("/api/equipment")
public class equipmentController {
    private final equipmentRepository equipmentRepository;
    public equipmentController(equipmentRepository equipmentRepository){
        this.equipmentRepository=equipmentRepository;
    }

    @GetMapping
    public List<equipment> getAll() {
        return equipmentRepository.findAll();
    }
    @PostMapping
    public  equipment create(@RequestBody equipment equipment) {
        equipment.setCode(null);
        return equipmentRepository.save(equipment);
        
    }
    @GetMapping("/{code}")   
    public equipment getById(@PathVariable Integer code){
    return equipmentRepository.findById(code).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado"));
}
@PutMapping("/{code}") 
public equipment update(@PathVariable Integer code, @RequestBody equipment equipment) {
    if (!equipmentRepository.existsById(code)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado");
    }
    equipment.setCode(code);
    return equipmentRepository.save(equipment);
}
@DeleteMapping("/{code}")
public void delete(@PathVariable Integer code) {
    if (!equipmentRepository.existsById(code)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado");
    }
    try {
        equipmentRepository.deleteById(code);
    } catch (DataIntegrityViolationException e) {
        throw new ResponseStatusException(HttpStatus.CONFLICT,
            "No se puede eliminar: el equipo está asignado a una suscripción");
}
}

    

}
