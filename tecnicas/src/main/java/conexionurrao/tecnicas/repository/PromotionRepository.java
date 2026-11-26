package conexionurrao.tecnicas.repository;
import java.time.LocalDate;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import conexionurrao.tecnicas.model.Promotion;

public interface PromotionRepository extends JpaRepository<Promotion,Integer> {
Optional<Promotion> findFirstByStartingDateLessThanEqualAndFinalDateGreaterThanEqual(LocalDate start, LocalDate end);
}
