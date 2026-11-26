package conexionurrao.tecnicas.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import conexionurrao.tecnicas.model.Customer;
import conexionurrao.tecnicas.repository.customerRepository;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;




@RestController 
@RequestMapping("/api/customers") 

public class customerController {
    private final customerRepository customerRepository;

    public customerController(customerRepository customerRepository){
        this.customerRepository=customerRepository;
    }
@GetMapping
public List<Customer> getAll() {
    return customerRepository.findAll();
}

@PostMapping
public Customer create(@RequestBody Customer customer){
    if (customer.getCustomerId() == null){
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cédula es obligatoria");
    }
    if (customerRepository.existsById(customer.getCustomerId())){
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un cliente con esa cedula");
    }
    return customerRepository.save(customer);
}
@GetMapping("/{id}")
public Customer getById(@PathVariable Integer id) {
    return customerRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado"));
}

@PutMapping("/{id}")
public Customer update(@PathVariable Integer id, @RequestBody Customer Customer) {
    if (!customerRepository.existsById(id)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado");
    }
    Customer.setCustomerId(id);
    return customerRepository.save(Customer);
}
@DeleteMapping("/{id}")
public void delete(@PathVariable Integer id) {
    if (!customerRepository.existsById(id)) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Cliente no encontrado");
    }
    try {
        customerRepository.deleteById(id);
    } catch (DataIntegrityViolationException e) {
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "No se puede eliminar: el cliente tiene suscripciones");
    }
}
@PostMapping("/verify")
public Customer verify(@RequestBody Customer data) {

    // Si no mandaron cédula manda un error
    if (data.getCustomerId() == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La cédula es obligatoria");
    }

    //Si no existe ningún cliente con esa cédula manda un error
    if (!customerRepository.existsById(data.getCustomerId())) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Los datos no coinciden con ningún cliente");
    }

    // Traer al cliente de la base de datos
    Customer customer = customerRepository.findById(data.getCustomerId()).get();

    // 4. Si el correo guardado no es igual al que escribió la persona, error
    if (!customer.getEmail().equalsIgnoreCase(data.getEmail())) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND,
            "Los datos no coinciden con ningún cliente");
    }

    // 5. Todo coincide: armar una respuesta que solo tenga el nombre
    Customer answer = new Customer();
    answer.setFirstName(customer.getFirstName());
    return answer;
}

}
