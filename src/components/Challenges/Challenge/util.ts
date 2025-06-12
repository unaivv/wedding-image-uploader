export const renderCountdown = (deadline: string, now: Date): string => {
    if (!deadline) {
        return "Fecha de plazo inválida 1";
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
        return "Fecha de plazo inválida 2";
    }

    const timeDiff = deadlineDate.getTime() - now.getTime();
    if (timeDiff <= 0) {
        return "El plazo ha expirado";
    }

    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
        return `${minutes} minutos`;
    }
    return `${hours} horas y ${minutes} minutos`;
};