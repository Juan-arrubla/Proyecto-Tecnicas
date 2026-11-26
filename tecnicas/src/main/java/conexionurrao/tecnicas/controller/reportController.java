package conexionurrao.tecnicas.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import conexionurrao.tecnicas.dto.PlanReport;
import conexionurrao.tecnicas.model.internetPlan;
import conexionurrao.tecnicas.model.Subscription;
import conexionurrao.tecnicas.repository.internetPlanRepository;
import conexionurrao.tecnicas.repository.subscriptionRepository;

@RestController 
@RequestMapping("/api/reports")
public class reportController {

    private final internetPlanRepository planRepository;
    private final subscriptionRepository subscriptionRepository;

    public reportController(internetPlanRepository planRepository,
                            subscriptionRepository subscriptionRepository) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @GetMapping("/plans")
    public List<PlanReport> plans() {

        // 1. Traer todos los planes y todas las suscripciones
        List<internetPlan> plans = planRepository.findAll();
        List<Subscription> subscriptions = subscriptionRepository.findAll();

        // 2. Aquí va el informe, una fila por plan
        List<PlanReport> report = new ArrayList<>();

        // 3. Para cada plan...
        for (internetPlan plan : plans) {

            // Los contadores de este plan empiezan en cero
            int total = 0;
            int active = 0;
            int income = 0;

            // 4. ...revisar todas las suscripciones
            for (Subscription subscription : subscriptions) {

                // ¿Esta suscripción es de este plan?
                Integer planOfSubscription = subscription.getPlan().getPlanId();
                if (planOfSubscription.equals(plan.getPlanId())) {

                    // Sí: cuenta para el total
                    total = total + 1;

                    // Si además está activa, cuenta como activa y suma su precio
                    if (subscription.getStatus().equals("activa")) {
                        active = active + 1;
                        income = income + subscription.getPrice();
                    }
                }
            }

            // 5. Agregar la fila de este plan al informe
            PlanReport row = new PlanReport(plan.getPlanId(), plan.getName(), total, active, income);
            report.add(row);
        }

        return report;
    }
}