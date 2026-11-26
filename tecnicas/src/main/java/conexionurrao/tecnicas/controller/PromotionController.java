package conexionurrao.tecnicas.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import conexionurrao.tecnicas.repository.PromotionRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import conexionurrao.tecnicas.model.Promotion;

import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;



@RestController 
@RequestMapping ("/api/promotions")
public class PromotionController {
    private final PromotionRepository PromotionRepository;

    public PromotionController(PromotionRepository PromotionRepository){
        this.PromotionRepository=PromotionRepository;
    }

    @GetMapping
    public List<Promotion> getAll() {
        return PromotionRepository.findAll();
    }
    @PostMapping
    public Promotion Create(@RequestBody Promotion Promotion) {
        Promotion.setPromotionId(null);
        return PromotionRepository.save(Promotion);
    }
    @GetMapping("/{id}")
    public Promotion getById(@PathVariable Integer id) {
        return PromotionRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Promocion no encontrada"));
    }
    @PutMapping("/{id}")  //EndPoint para actualizar una promocion de internet, usa el Put
    public Promotion update(@PathVariable Integer id, @RequestBody Promotion Promotion) {
        if (!PromotionRepository.existsById(id)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Promocion no encontrada");
    }
    Promotion.setPromotionId(id);
    return PromotionRepository.save(Promotion);
    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
    if (!PromotionRepository.existsById(id)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Promocion no encontrada");
    }
    PromotionRepository.deleteById(id);
    

}

    
    
}
