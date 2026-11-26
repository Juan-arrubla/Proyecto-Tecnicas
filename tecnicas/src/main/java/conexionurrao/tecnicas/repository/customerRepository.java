package conexionurrao.tecnicas.repository;
import conexionurrao.tecnicas.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface customerRepository extends JpaRepository<Customer,Integer> {

}
