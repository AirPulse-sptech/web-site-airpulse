-- Dados fictícios para testar a comparação por hora do gestor.
-- Execute no banco de desenvolvimento. Cada execução adiciona seis relatórios.
-- Requer as aeronaves PR-AER / PR-ANV e o analista Otavio do scriptBd.sql.
-- Não cria objetos no S3 nem vínculos fictícios com alertas.
USE airpulse;

SET @agora_kpi = NOW();
SET @autor_kpi = (SELECT idFuncionario FROM funcionario WHERE emailCorporativo = 'otavio@gmail.com' AND cargo = 'ANALISTA' LIMIT 1);

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT '[DEMO KPI] CPU elevada no FMC Mestre', DATE(@agora_kpi), DATE(@agora_kpi),
    'CPU acima de 90% durante a coleta. Plano de ação: identificar os processos com maior consumo, revisar tarefas concorrentes e repetir a coleta após o ajuste.', 'PENDENTE',
    'PUBLICADO', 'CRITICO', 'PROCESSADOR',
    DATE_SUB(@agora_kpi, INTERVAL 10 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-AER' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(@agora_kpi), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT '[DEMO KPI] Memória elevada no FMC Reserva', DATE(@agora_kpi), DATE(@agora_kpi),
    'Memória acima do limite crítico durante a coleta. Plano de ação: verificar crescimento dos processos, investigar vazamento de memória e validar o consumo após a correção.', 'PENDENTE',
    'PUBLICADO', 'CRITICO', 'MEMORIA_RAM',
    DATE_SUB(@agora_kpi, INTERVAL 20 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-ANV' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(@agora_kpi), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT '[DEMO KPI] Ocupação de disco em atenção', DATE(@agora_kpi), DATE(@agora_kpi),
    'Ocupação de disco acima do limite de atenção. Plano de ação: revisar retenção de logs, liberar arquivos temporários e acompanhar o espaço disponível.', 'PENDENTE',
    'PUBLICADO', 'ATENCAO', 'ARMAZENAMENTO',
    DATE_SUB(@agora_kpi, INTERVAL 30 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-AER' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(@agora_kpi), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT '[DEMO KPI] Oscilação no uso de CPU', DATE(@agora_kpi), DATE(@agora_kpi),
    'Picos recorrentes de CPU durante tarefas simultâneas. Plano de ação: revisar o agendamento das tarefas e acompanhar novas coletas.', 'PENDENTE',
    'PUBLICADO', 'ATENCAO', 'PROCESSADOR',
    DATE_SUB(@agora_kpi, INTERVAL 40 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-ANV' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(@agora_kpi), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT '[DEMO KPI] CPU crítica na hora anterior', DATE(@agora_kpi), DATE(@agora_kpi),
    'CPU acima do limite crítico na coleta anterior. Plano de ação: investigar tarefas de maior consumo e comparar as próximas leituras.', 'PENDENTE',
    'PUBLICADO', 'CRITICO', 'PROCESSADOR',
    DATE_SUB(@agora_kpi, INTERVAL 75 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-AER' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(@agora_kpi), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT '[DEMO KPI] Disco em atenção na hora anterior', DATE(@agora_kpi), DATE(@agora_kpi),
    'Ocupação de disco em atenção na coleta anterior. Plano de ação: revisar arquivos temporários e política de retenção.', 'PENDENTE',
    'PUBLICADO', 'ATENCAO', 'ARMAZENAMENTO',
    DATE_SUB(@agora_kpi, INTERVAL 90 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-AER' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(@agora_kpi), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

-- Confere os relatórios adicionados nesta execução.
SELECT idRelatorio, titulo, criticidade, dataCriacao
FROM relatorio
WHERE titulo LIKE '[DEMO KPI] %'
    AND dataCriacao BETWEEN DATE_SUB(@agora_kpi, INTERVAL 90 MINUTE) AND @agora_kpi
ORDER BY dataCriacao DESC;

