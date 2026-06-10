import { Horario } from '../../clases/Horario';

/** Devuelve una fecha futura en formato YYYY-MM-DD sumando `dias` días a hoy */
function fechaFutura(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('Horario', () => {
  describe('getters', () => {
    it('retornan los valores del constructor', () => {
      // arrange
      const inicio = fechaFutura(1);
      const fin = fechaFutura(3);
      const horario = new Horario(inicio, fin, '09:00', '17:00', 'horario-1');

      // act & assert
      expect(horario.obtenerId()).toBe('horario-1');
      expect(horario.obtenerFechaInicio()).toBe(inicio);
      expect(horario.obtenerFechaFin()).toBe(fin);
      expect(horario.obtenerHoraApertura()).toBe('09:00');
      expect(horario.obtenerHoraCierre()).toBe('17:00');
    });
  });

  describe('constructor validaciones', () => {
    it('lanza error si la fecha de inicio está en el pasado', () => {
      // arrange & act & assert
      expect(() => new Horario('2020-01-01', '2020-01-02', '09:00', '17:00')).toThrow(
        'No se pueden crear horarios en fechas pasadas'
      );
    });

    it('lanza error si la fecha de fin es anterior a la de inicio', () => {
      // arrange
      const inicio = fechaFutura(5);
      const fin = fechaFutura(2);

      // act & assert
      expect(() => new Horario(inicio, fin, '09:00', '17:00')).toThrow(
        'La fecha de fin debe ser mayor o igual a la fecha de inicio'
      );
    });

    it('lanza error si la hora de apertura es mayor o igual al cierre', () => {
      // arrange
      const inicio = fechaFutura(1);
      const fin = fechaFutura(3);

      // act & assert
      expect(() => new Horario(inicio, fin, '17:00', '09:00')).toThrow(
        'La hora de cierre debe ser mayor a la hora de apertura'
      );
    });
  });

  describe('calcularFranjasHorarias()', () => {
    it('genera 2 franjas de 60 minutos con apertura 09:00 y cierre 11:00 (un solo día)', () => {
      // arrange
      const fecha = fechaFutura(1);
      const horario = new Horario(fecha, fecha, '09:00', '11:00');

      // act
      const franjas = horario.calcularFranjasHorarias(60);

      // assert
      expect(franjas).toHaveLength(2);
      expect(franjas[0]).toEqual({ fecha, horaInicio: '09:00', horaFin: '10:00' });
      expect(franjas[1]).toEqual({ fecha, horaInicio: '10:00', horaFin: '11:00' });
    });

    it('genera 2 franjas de 30 minutos con apertura 09:00 y cierre 10:00 (un solo día)', () => {
      // arrange
      const fecha = fechaFutura(1);
      const horario = new Horario(fecha, fecha, '09:00', '10:00');

      // act
      const franjas = horario.calcularFranjasHorarias(30);

      // assert
      expect(franjas).toHaveLength(2);
      expect(franjas[0]).toEqual({ fecha, horaInicio: '09:00', horaFin: '09:30' });
      expect(franjas[1]).toEqual({ fecha, horaInicio: '09:30', horaFin: '10:00' });
    });

    it('genera franjas para cada día del rango fechaInicio..fechaFin', () => {
      // arrange
      const dia1 = fechaFutura(1);
      const dia2 = fechaFutura(2);
      const horario = new Horario(dia1, dia2, '09:00', '10:00');

      // act
      const franjas = horario.calcularFranjasHorarias(60);

      // assert — 1 franja por día × 2 días
      expect(franjas).toHaveLength(2);
      expect(franjas[0].fecha).toBe(dia1);
      expect(franjas[1].fecha).toBe(dia2);
    });

    it('lanza error si la duración es 0 o negativa', () => {
      // arrange
      const fecha = fechaFutura(1);
      const horario = new Horario(fecha, fecha, '09:00', '11:00');

      // act & assert
      expect(() => horario.calcularFranjasHorarias(0)).toThrow(
        'La duración del servicio debe ser positiva'
      );
    });
  });
});
