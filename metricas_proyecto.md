# UNL-Cloud-Connect: Métricas e Indicadores del Proyecto

**Integrantes:** 
* Isabel Morocho
* Miguel Luna
* Estefanía Cale
* David Guamán
* Stiven Jimenez

**Docente:** Ing. Roberth Figueroa  
**Fecha:** 09/07/2026  

---

## Tabla de Métricas

A continuación se detallan las medidas, métricas e indicadores de rendimiento definidos para la evaluación del proyecto UNL-Cloud-Connect. Es importante diferenciar entre:
*   **Medida:** El dato base o número bruto que se recolecta.
*   **Métrica:** El cálculo o ratio que relaciona medidas para darles contexto.
*   **Indicador (KPI):** La métrica evaluada contra una meta u objetivo técnico.

| Idea Original | Medida (Dato Bruto) | Métrica (Cálculo/Contexto) | Indicador (KPI para evaluar) |
| :--- | :--- | :--- | :--- |
| **1. Cantidad de datos de la ESP32** | Número total de paquetes de datos recibidos desde la ESP32 y número de paquetes esperados. | **Tasa de entrega de datos IoT:** (Paquetes recibidos / Paquetes esperados) * 100. | **Disponibilidad del Sensor:** Porcentaje de pérdida de paquetes menor al 5% por hora de transmisión continua. |
| **2. Eventos creados correctamente** | Total de intentos de creación de eventos vs. eventos guardados en la base de datos sin errores. | **Tasa de éxito en creación de eventos:** (Eventos creados exitosamente / Total de intentos) * 100. | **Fiabilidad del Módulo de Eventos:** Mantener una tasa de éxito en la creación de eventos superior al 98% semanal. |
| **3. Usuarios ingresados** | Número de inicios de sesión exitosos y número de registros de nuevos usuarios. | **Tasa de Usuarios Activos Diarios (DAU):** Cantidad de usuarios únicos que inician sesión por día. | **Nivel de Adopción:** Incrementar o mantener al menos un 15% de usuarios activos semanales sobre el total de usuarios registrados. |
