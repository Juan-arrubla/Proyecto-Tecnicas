package conexionurrao.tecnicas.repository;
import org.springframework.data.jpa.repository.JpaRepository;

import conexionurrao.tecnicas.model.Subscription;

public interface subscriptionRepository extends JpaRepository<Subscription,Integer> {

}
