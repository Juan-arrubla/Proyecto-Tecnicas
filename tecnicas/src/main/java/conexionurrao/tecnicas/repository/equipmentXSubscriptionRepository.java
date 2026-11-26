package conexionurrao.tecnicas.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import conexionurrao.tecnicas.model.EquipmentxSubscription;


public interface equipmentXSubscriptionRepository extends JpaRepository<EquipmentxSubscription,Integer> {
    List<EquipmentxSubscription> findBySubscriptionSubscriptionId(Integer subscriptionId);

    boolean existsByEquipmentCode(Integer code);
    

}
