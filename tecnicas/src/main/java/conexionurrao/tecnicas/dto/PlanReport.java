package conexionurrao.tecnicas.dto;

public class PlanReport {
    private Integer planId;
    private String planName;
    private int totalSubscriptions;
    private int activeSubscriptions;
    private int monthlyIncome;

    public Integer getPlanId() {
        return planId;
    }

    public void setPlanId(Integer planId) {
        this.planId = planId;
    }

    public String getPlanName() {
        return planName;
    }

    public void setPlanName(String planName) {
        this.planName = planName;
    }

    public int getTotalSubscriptions() {
        return totalSubscriptions;
    }

    public void setTotalSubscriptions(int totalSubscriptions) {
        this.totalSubscriptions = totalSubscriptions;
    }

    public int getActiveSubscriptions() {
        return activeSubscriptions;
    }

    public void setActiveSubscriptions(int activeSubscriptions) {
        this.activeSubscriptions = activeSubscriptions;
    }

    public int getMonthlyIncome() {
        return monthlyIncome;
    }

    public void setMonthlyIncome(int monthlyIncome) {
        this.monthlyIncome = monthlyIncome;
    }

    public PlanReport(Integer planId, String planName, int totalSubscriptions,
                      int activeSubscriptions, int monthlyIncome) {
        this.planId = planId;
        this.planName = planName;
        this.totalSubscriptions = totalSubscriptions;
        this.activeSubscriptions = activeSubscriptions;
        this.monthlyIncome = monthlyIncome;
    }

}