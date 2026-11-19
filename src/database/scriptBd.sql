CREATE DATABASE IF NOT EXISTS airpulse;
USE airpulse;

CREATE TABLE endereco (
idEndereco INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
cep CHAR(8),
logradouro VARCHAR(100),
bairro VARCHAR(100),
numero VARCHAR(20),
complemento VARCHAR(100),
estado CHAR(2),
cidade VARCHAR(100)
);

CREATE TABLE empresaFabricante (
idEmpresaFabricante  INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
razaoSocial VARCHAR(100),
nomeFantasia VARCHAR(100),
cnpj CHAR(14),
segmentoAtuacao VARCHAR(80),
telefone VARCHAR(20) NOT NULL,
statusSistema VARCHAR(80) NOT NULL,
entradaSistema DATETIME NOT NULL,
fkEndereco INT,
CONSTRAINT ctEmpresaFabricanteStatus CHECK (statusSistema IN ('ATIVO', 'INATIVO')),
CONSTRAINT ctEmpresaFabricanteEndereco
FOREIGN KEY (fkEndereco) REFERENCES endereco (idEndereco)
);

CREATE TABLE funcionario (
idFuncionario INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(100),
dataNascimento DATE,
emailCorporativo VARCHAR(100),
telefone VARCHAR(20),
cpf CHAR(11),
cargo VARCHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
senha VARCHAR(200),
statusSistema VARCHAR(80) NOT NULL,
entradaSistema DATETIME,
fkEmpresaFabricante INT NOT NULL,
CONSTRAINT ctFuncionarioCargo CHECK (CAST(cargo AS BINARY) IN ('ADMIN', 'GESTOR', 'ANALISTA')),
CONSTRAINT ctFuncionarioEmpresaFabricante
FOREIGN KEY (fkEmpresaFabricante) REFERENCES empresaFabricante (idEmpresaFabricante)
);

CREATE TABLE aeronave (
idAeronave INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(100),
modelo VARCHAR(100),
numeroSerie VARCHAR(45),
statusAeronave VARCHAR(45),
entradaSistema DATETIME,
companhiaAerea VARCHAR(100),
fkEmpresaFabricante INT NOT NULL,
CONSTRAINT ctAeronaveEmpresaFabricante
FOREIGN KEY (fkEmpresaFabricante) REFERENCES empresaFabricante (idEmpresaFabricante)
);

CREATE TABLE funcionarioAeronave (
fkFuncionario INT NOT NULL,
fkAeronave INT NOT NULL,
dataVinculo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (fkFuncionario, fkAeronave),
CONSTRAINT ctFuncionarioAeronaveFuncionario
FOREIGN KEY (fkFuncionario) REFERENCES funcionario (idFuncionario),
CONSTRAINT ctFuncionarioAeronaveAeronave
FOREIGN KEY (fkAeronave) REFERENCES aeronave (idAeronave)
);

CREATE TABLE computador (
idComputador INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(45),
tipoFmc VARCHAR(45),
hostname VARCHAR(255) NOT NULL,
modelo VARCHAR(100) NOT NULL,
statusComputador VARCHAR(45) NOT NULL,
dataInstalacao DATE NOT NULL,
entradaSistema DATE NOT NULL,
fkAeronave INT NOT NULL,
CONSTRAINT ctComputadorAeronave
FOREIGN KEY (fkAeronave) REFERENCES aeronave (idAeronave)
);

CREATE TABLE placa (
idPlaca INT PRIMARY KEY UNIQUE NOT NULL AUTO_INCREMENT,
nome VARCHAR(100),
modelo VARCHAR(100),
numeroSerie VARCHAR(45),
fkComputador INT NOT NULL,
CONSTRAINT ctPlacaComputador
FOREIGN KEY (fkComputador) REFERENCES computador (idComputador)
);

CREATE TABLE componente (
idComponente INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
tipo VARCHAR(45),
modelo VARCHAR(100),
statusMonitoramento VARCHAR(45),
limiteAtencao DECIMAL(14,2),
limiteCritico DECIMAL(14,2),
fkPlaca INT NOT NULL,
CONSTRAINT ctComponentePlaca
FOREIGN KEY (fkPlaca) REFERENCES placa (idPlaca)
);

CREATE TABLE metrica (
idMetrica INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nome VARCHAR(45),
unidadeMedida VARCHAR(45),
descricao VARCHAR(200),
fkComponente INT NOT NULL,
CONSTRAINT fkMetricaComponente1
FOREIGN KEY (fkComponente) REFERENCES componente (idComponente)
);

CREATE TABLE leitura (
idLeitura INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
valor DECIMAL(14,2) NOT NULL,
dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
fkMetrica INT NOT NULL,
CONSTRAINT fkLeituraMetrica
FOREIGN KEY (fkMetrica) REFERENCES metrica (idMetrica)
);

CREATE TABLE alerta (
idAlerta INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
nivel VARCHAR(10) NOT NULL,
valor DECIMAL(14,2) NOT NULL,
dataHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
fkLeitura INT NOT NULL,
CONSTRAINT ctAlertaNivel CHECK (nivel IN ('ATENCAO', 'CRITICO')),
CONSTRAINT fkAlertaLeitura
FOREIGN KEY (fkLeitura) REFERENCES leitura (idLeitura)
);

CREATE TABLE relatorio (
idRelatorio INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
titulo VARCHAR(150) NOT NULL,
periodoInicio DATE NOT NULL,
periodoFim DATE NOT NULL,
texto MEDIUMTEXT NOT NULL,
statusAnalise VARCHAR(15) NOT NULL DEFAULT 'PENDENTE',
dataProcessamentoAnalise DATETIME,
erroAnalise VARCHAR(255),
statusRelatorio VARCHAR(45) NOT NULL DEFAULT 'RASCUNHO',
criticidade VARCHAR(45),
categoria VARCHAR(20) NOT NULL,
dataCriacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
fkAeronave INT NOT NULL,
CONSTRAINT ctRelatorioStatus CHECK (statusRelatorio IN ('RASCUNHO', 'EM_REVISAO', 'PUBLICADO')),
CONSTRAINT ctRelatorioCriticidade CHECK (criticidade IN ('ATENCAO', 'CRITICO')),
CONSTRAINT ctRelatorioCategoria CHECK (categoria IN ('DESEMPENHO', 'FALHA_HARDWARE', 'ARMAZENAMENTO', 'MEMORIA_RAM', 'PROCESSADOR', 'PERDA_CONEXAO')),
CONSTRAINT ctRelatorioPeriodo CHECK (periodoFim >= periodoInicio),
CONSTRAINT ctRelatorioAnalise CHECK (statusAnalise IN ('PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'ERRO')),
CONSTRAINT fkRelatorioAeronave
FOREIGN KEY (fkAeronave) REFERENCES aeronave (idAeronave),
INDEX idxRelatorioStatusCategoria (statusRelatorio, categoria)
);

CREATE TABLE analiseRelatorio (
idAnalise INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
fkRelatorio INT NOT NULL,
componente VARCHAR(60) NOT NULL,
sintoma VARCHAR(150) NOT NULL,
situacao VARCHAR(20) NOT NULL,
recomendacao TEXT,
trechoEvidencia TEXT NOT NULL,
dataAnalise DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT ctAnaliseSituacao CHECK (situacao IN ('IDENTIFICADO', 'SUSPEITO', 'CORRIGIDO', 'NAO_INFORMADO')),
CONSTRAINT fkAnaliseRelatorio FOREIGN KEY (fkRelatorio) REFERENCES relatorio (idRelatorio) ON DELETE CASCADE,
INDEX idxAnaliseRelatorio (fkRelatorio)
);

CREATE TABLE funcionarioRelatorio (
idFuncionarioRelatorio INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
dataVinculo DATE NOT NULL,
papel VARCHAR(10) NOT NULL DEFAULT 'COAUTOR',
fkFuncionario INT NOT NULL,
CONSTRAINT fkFuncionarioRelatorio1
FOREIGN KEY (fkFuncionario) REFERENCES funcionario (idFuncionario),
fkRelatorio INT NOT NULL,
CONSTRAINT fkFuncionarioRelatorio2
FOREIGN KEY (fkRelatorio) REFERENCES relatorio (idRelatorio),
CONSTRAINT ctFuncionarioRelatorioPapel CHECK (papel IN ('AUTOR', 'COAUTOR')),
CONSTRAINT ctFuncionarioRelatorioUnico UNIQUE (fkFuncionario, fkRelatorio)
);

CREATE TABLE relatorioAlerta (
fkRelatorio INT NOT NULL,
alertaIdAws VARCHAR(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
dadosAlerta JSON NOT NULL,
dataVinculo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (fkRelatorio, alertaIdAws),
CONSTRAINT fkRelatorioAlertaRelatorio
FOREIGN KEY (fkRelatorio) REFERENCES relatorio (idRelatorio) ON DELETE CASCADE
);

INSERT INTO endereco (cep, logradouro, bairro, numero, complemento, estado, cidade)
VALUES ('04571010', 'Avenida das Nações Unidas', 'Itaim Bibi', '1000', 'Sala 10', 'SP', 'São Paulo');

INSERT INTO empresaFabricante (
    razaoSocial, nomeFantasia, cnpj, segmentoAtuacao, telefone,
    statusSistema, entradaSistema, fkEndereco
) VALUES (
    'AeroNova Sistemas Ltda.', 'AeroNova', '12345678000195', 'Fabricante de computadores de bordo',
    '1130001000', 'ATIVO', NOW(), 1
);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES (
    'Liziane', '1992-08-20', 'liziane@gmail.com', '11970001002', '11144477735',
    'GESTOR', 'urubu100', '1', NOW(), 1
);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES (
    'Otavio', '1994-02-14', 'otavio@gmail.com', '11970001001', '98765432100',
    'ANALISTA', 'urubu100', '1', NOW(), 1
);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES
    ('Mariana', '1995-03-12', 'mariana@gmail.com', '11970001003', '52998224725',
        'ANALISTA', 'urubu100', '1', NOW(), 1),
    ('Lucas', '1993-06-25', 'lucas@gmail.com', '11970001004', '16899535009',
        'ANALISTA', 'urubu100', '1', NOW(), 1),
    ('Beatriz', '1996-11-08', 'beatriz@gmail.com', '11970001005', '12345678909',
        'ANALISTA', 'urubu100', '1', NOW(), 1),
    ('Rafael', '1991-09-17', 'rafael@gmail.com', '11970001006', '39053344705',
        'ANALISTA', 'urubu100', '1', NOW(), 1),
    ('Camila', '1997-04-30', 'camila@gmail.com', '11970001007', '86288366757',
        'ANALISTA', 'urubu100', '1', NOW(), 1);

INSERT INTO funcionario (
    nome, dataNascimento, emailCorporativo, telefone, cpf, cargo, senha,
    statusSistema, entradaSistema, fkEmpresaFabricante
) VALUES (
    'AirPulse', '1990-01-01', 'airpulse@gmail.com', '11999999999', '00000000000',
    'ADMIN', 'urubu100', '1', NOW(), 1
);

INSERT INTO aeronave (
    nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante
) VALUES ('PR-AER', 'Boeing 737-8', 'AN-001', 'ATIVA',
    DATE_SUB(NOW(), INTERVAL 90 DAY), 'GOL', 1);

INSERT INTO aeronave (
    nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante
) VALUES ('PR-ANV', 'Airbus A320neo', 'AN-002', 'ATIVA',
    DATE_SUB(NOW(), INTERVAL 90 DAY), 'LATAM', 1);

INSERT INTO aeronave (
    nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante
) VALUES ('PR-MNT', 'Embraer E195-E2', 'AN-003', 'MANUTENCAO',
    DATE_SUB(NOW(), INTERVAL 90 DAY), 'Azul', 1);

INSERT INTO aeronave (
    nome, modelo, numeroSerie, statusAeronave, entradaSistema, companhiaAerea, fkEmpresaFabricante
) VALUES ('PR-RES', 'Boeing 737-800', 'AN-004', 'INATIVA',
    DATE_SUB(NOW(), INTERVAL 90 DAY), 'GOL', 1);

INSERT INTO funcionarioAeronave (fkFuncionario, fkAeronave, dataVinculo)
VALUES
    (2, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (2, 2, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (2, 3, DATE_SUB(NOW(), INTERVAL 30 DAY)),
    (3, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (3, 3, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (4, 2, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (4, 3, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (5, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (5, 2, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (5, 3, DATE_SUB(NOW(), INTERVAL 30 DAY)),
    (6, 1, DATE_SUB(NOW(), INTERVAL 60 DAY)),
    (6, 2, DATE_SUB(NOW(), INTERVAL 45 DAY)),
    (7, 3, DATE_SUB(NOW(), INTERVAL 30 DAY));

INSERT INTO computador (
    nome, tipoFmc, hostname, modelo, statusComputador, dataInstalacao, entradaSistema, fkAeronave
) VALUES
    ('FMC PR-AER MESTRE', 'MESTRE', 'pr-aer-mestre', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 1),
    ('FMC PR-AER SPARE', 'SPARE', 'pr-aer-spare', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 1),
    ('FMC PR-ANV MESTRE', 'MESTRE', 'pr-anv-mestre', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 2),
    ('FMC PR-ANV SPARE', 'SPARE', 'pr-anv-spare', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 2),
    ('FMC PR-MNT MESTRE', 'MESTRE', 'pr-mnt-mestre', 'FMC-3000', 'MANUTENCAO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 3),
    ('FMC PR-MNT SPARE', 'SPARE', 'pr-mnt-spare', 'FMC-3000', 'ATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 3),
    ('FMC PR-RES MESTRE', 'MESTRE', 'pr-res-mestre', 'FMC-3000', 'INATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 4),
    ('FMC PR-RES SPARE', 'SPARE', 'pr-res-spare', 'FMC-3000', 'INATIVO',
        DATE_SUB(CURDATE(), INTERVAL 90 DAY), DATE_SUB(CURDATE(), INTERVAL 90 DAY), 4);

INSERT INTO placa (nome, modelo, numeroSerie, fkComputador)
VALUES
    ('Placa principal FMC PR-AER MESTRE', 'AP-BOARD-3000', 'PL-1', 1),
    ('Placa principal FMC PR-AER SPARE', 'AP-BOARD-3000', 'PL-2', 2),
    ('Placa principal FMC PR-ANV MESTRE', 'AP-BOARD-3000', 'PL-3', 3),
    ('Placa principal FMC PR-ANV SPARE', 'AP-BOARD-3000', 'PL-4', 4),
    ('Placa principal FMC PR-MNT MESTRE', 'AP-BOARD-3000', 'PL-5', 5),
    ('Placa principal FMC PR-MNT SPARE', 'AP-BOARD-3000', 'PL-6', 6),
    ('Placa principal FMC PR-RES MESTRE', 'AP-BOARD-3000', 'PL-7', 7),
    ('Placa principal FMC PR-RES SPARE', 'AP-BOARD-3000', 'PL-8', 8);

INSERT INTO componente (tipo, modelo, statusMonitoramento, limiteAtencao, limiteCritico, fkPlaca)
VALUES
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 1),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 1),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 1),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 2),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 2),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 2),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 3),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 3),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 3),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 4),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 4),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 4),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 5),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 5),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 5),
    ('CPU', 'Processador embarcado quad-core', 'ATIVO', 75.00, 90.00, 6),
    ('RAM', 'Memória DDR4 16 GB', 'ATIVO', 80.00, 95.00, 6),
    ('DISCO', 'SSD industrial 256 GB', 'ATIVO', 80.00, 90.00, 6),
    ('CPU', 'Processador embarcado quad-core', 'INATIVO', 75.00, 90.00, 7),
    ('RAM', 'Memória DDR4 16 GB', 'INATIVO', 80.00, 95.00, 7),
    ('DISCO', 'SSD industrial 256 GB', 'INATIVO', 80.00, 90.00, 7),
    ('CPU', 'Processador embarcado quad-core', 'INATIVO', 75.00, 90.00, 8),
    ('RAM', 'Memória DDR4 16 GB', 'INATIVO', 80.00, 95.00, 8),
    ('DISCO', 'SSD industrial 256 GB', 'INATIVO', 80.00, 90.00, 8);

INSERT INTO metrica (nome, unidadeMedida, descricao, fkComponente)
VALUES
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 1),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 2),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 3),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 4),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 5),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 6),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 7),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 8),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 9),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 10),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 11),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 12),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 13),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 14),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 15),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 16),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 17),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 18),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 19),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 20),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 21),
    ('Uso de CPU', '%', 'Percentual de utilização do componente do FMC.', 22),
    ('Uso de memória RAM', '%', 'Percentual de utilização do componente do FMC.', 23),
    ('Uso de armazenamento', '%', 'Percentual de utilização do componente do FMC.', 24);

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusRelatorio,
    criticidade, categoria, dataCriacao, fkAeronave
) VALUES
    ('Análise dos picos de CPU no FMC mestre da PR-AER', DATE_SUB(CURDATE(), INTERVAL 35 DAY),
        DATE_SUB(CURDATE(), INTERVAL 29 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-AER, Boeing 737-8. Análise dos picos de CPU do FMC pr-aer-mestre em 12 ciclos de teste do período informado.
O QUE FOI OBSERVADO: Em três ciclos, CPU entre 78% e 82% durante a coleta simultânea à consolidação de registros, acima da atenção de 75% e abaixo do crítico de 90%. O tempo de resposta atingiu 410 ms, contra 180 a 240 ms nos demais ciclos. RAM máxima de 72%, sem reinícios. O spare atingiu no máximo 61% de CPU.
SITUAÇÃO: Uso elevado de CPU identificado, sem correção validada. O impacto observado foi aumento do tempo de resposta nos ciclos afetados, sem evidência de interrupção do processamento.
POSSÍVEL CAUSA RAIZ: Concorrência entre coleta e consolidação de registros, sustentada pela coincidência dos picos com essas tarefas. Falta perfil de execução para confirmar a causa raiz.
AÇÕES REALIZADAS: O analista comparou os dois FMCs, correlacionou as janelas dos picos com as tarefas e revisou os logs. Nenhuma alteração de configuração foi realizada.
RECOMENDAÇÕES: Coletar perfil de execução por processo e comparar 12 ciclos equivalentes com as tarefas escalonadas. Registrar CPU e tempo de resposta antes e depois; validar o ajuste se não houver amostras acima de 75% nem retorno dos atrasos observados.',
        'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 29 DAY), '00:00:00'), 1),
    ('Inspeção do módulo de controle', DATE_SUB(CURDATE(), INTERVAL 33 DAY),
        DATE_SUB(CURDATE(), INTERVAL 27 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-ANV, Airbus A320neo. Foram acompanhados 10 ciclos de teste dos FMCs pr-anv-mestre e pr-anv-spare.
O QUE FOI OBSERVADO: A placa principal PL-3 do FMC mestre apresentou três reinícios inesperados em dois ciclos distintos, com interrupções de processamento de 8, 11 e 14 segundos. O log local registrou reinício do controlador nos mesmos instantes. Antes dos eventos, CPU máxima de 67% e RAM máxima de 74%, abaixo dos limites de atenção de 75% e 80%.
SITUAÇÃO: Reinício inesperado do FMC mestre identificado e ainda não corrigido. Instabilidade na alimentação da placa é suspeita, sem medição elétrica que confirme a causa. O spare permaneceu acessível, sem reinícios nos ciclos observados; isso não comprova a integridade do mestre.
POSSÍVEL CAUSA RAIZ: Instabilidade na alimentação da placa PL-3 é uma hipótese; o log confirma os reinícios, mas não sua origem elétrica.
AÇÕES REALIZADAS: O analista revisou os logs dos reinícios e comparou CPU e RAM nos eventos com os ciclos sem falha. Não houve reparo nem troca da placa.
RECOMENDAÇÕES: Inspecionar a alimentação e os conectores da placa PL-3 em bancada antes de encerrar a ocorrência. Registrar tensão durante a reprodução da falha e repetir 10 ciclos após eventual reparo.
LIMITAÇÃO: A causa e a eficácia do reparo permanecem sem confirmação; a classificação crítica decorre das interrupções registradas.',
        'PUBLICADO', 'CRITICO', 'FALHA_HARDWARE',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 27 DAY), '00:00:00'), 2),
    ('Capacidade de armazenamento do FMC', DATE_SUB(CURDATE(), INTERVAL 31 DAY),
        DATE_SUB(CURDATE(), INTERVAL 25 DAY), 'RESUMO DO INCIDENTE: Cenário fictício de capacidade do SSD de 256 GB do FMC pr-aer-mestre, PR-AER, durante sete dias de acompanhamento.
O QUE FOI OBSERVADO: O uso de armazenamento aumentou de 76% para 86%, acima do limite de atenção de 80% e abaixo do crítico de 90%. Foram observados 220,16 GB ocupados e 35,84 GB livres no encerramento. Os registros de diagnóstico representavam 42 GB, dos quais 18 GB tinham retenção vencida. O spare terminou com 58% de ocupação.
SITUAÇÃO: Uso elevado de armazenamento identificado, sem limpeza executada neste período. Não foram observadas falhas de gravação. A associação do crescimento com os registros de diagnóstico é sustentada pelo inventário; não foi avaliada a evolução de outros diretórios.
POSSÍVEL CAUSA RAIZ: Acúmulo de registros de diagnóstico sem remoção após o prazo de retenção. O inventário sustenta a hipótese, mas não isola a contribuição dos demais diretórios.
AÇÕES REALIZADAS: O analista comparou a evolução de ocupação e inventariou os registros por prazo de retenção. Nenhum arquivo foi removido.
RECOMENDAÇÕES: Validar a retenção com a equipe responsável e remover somente os registros vencidos após cópia verificada. Medir a ocupação ao final da limpeza e acompanhar o crescimento por sete dias.
IMPACTO: A redução de espaço livre exige planejamento de capacidade, sem evidência de indisponibilidade neste recorte.',
        'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 25 DAY), '00:00:00'), 1),
    ('Uso elevado de memória RAM', DATE_SUB(CURDATE(), INTERVAL 29 DAY),
        DATE_SUB(CURDATE(), INTERVAL 23 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-MNT, Embraer E195-E2 em manutenção. Avaliação de oito ciclos de diagnóstico em bancada do FMC pr-mnt-mestre, equipado com 16 GB de RAM.
O QUE FOI OBSERVADO: Uso elevado de memória identificado em cinco ciclos, com RAM máxima de 97%, equivalente a 15,52 GB, acima do limite crítico de 95%. A ocupação permaneceu acima de 95% por 18 minutos acumulados. Foram observadas duas interrupções do processo de diagnóstico por falta de memória. No spare, o máximo foi 71%.
HIPÓTESE: Vazamento de memória no processo de diagnóstico é suspeito, pois a ocupação cresceu de 62% para 97% ao longo de quatro repetições. Não há perfil de alocações que confirme essa causa; defeito físico de RAM também não foi demonstrado.
POSSÍVEL CAUSA RAIZ: Retenção de memória pelo processo de diagnóstico é suspeita. O crescimento entre repetições não confirma sozinho vazamento nem defeito físico.
AÇÕES REALIZADAS: O analista comparou as repetições do diagnóstico e os registros de interrupção por falta de memória. O reinício do processo foi apenas uma contenção temporária.
RECOMENDAÇÕES: Coletar o perfil de memória do processo em bancada e comparar o consumo após cada repetição. Repetir oito ciclos após a correção proposta, verificando ausência de interrupções e RAM abaixo de 80%.
SITUAÇÃO: Problema não corrigido até o encerramento. Reiniciar o processo reduziu temporariamente o uso para 64%, sem demonstrar solução definitiva.',
        'PUBLICADO', 'CRITICO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 23 DAY), '00:00:00'), 3),
    ('Picos de processamento em voo', DATE_SUB(CURDATE(), INTERVAL 27 DAY),
        DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-ANV, FMC pr-anv-mestre. Foram avaliados 14 ciclos simulando carga de voo, com comparação ao spare.
O QUE FOI OBSERVADO: Uso elevado de CPU identificado em seis ciclos, com picos de 84% a 88% durante tarefas simultâneas de coleta e consolidação. O tempo acumulado acima de 75% foi de 22 minutos; nenhum pico atingiu o limite crítico de 90%. O tempo de resposta subiu de 210 ms para 460 ms durante os eventos. O spare atingiu no máximo 63% de CPU.
SITUAÇÃO: A coincidência entre tarefas e picos foi observada, mas a causa ainda não foi confirmada por perfil de execução. Não houve reinício nem interrupção de comunicação no recorte. Os reinícios descritos no relatório anterior da PR-ANV são outra ocorrência, sem evidência de relação causal com estes picos.
POSSÍVEL CAUSA RAIZ: Sobreposição de tarefas de coleta e consolidação é suspeita. A coincidência temporal ainda precisa de validação por perfil de execução.
AÇÕES REALIZADAS: O analista correlacionou os picos com a execução simultânea das tarefas e comparou o mestre com o spare. O agendamento ainda não foi alterado nesta janela.
RECOMENDAÇÕES: Revisar o agendamento das tarefas de coleta e medir CPU e tempo de resposta em 14 ciclos equivalentes após o ajuste. Acompanhar também o mestre quanto aos reinícios ainda sob investigação.
CONCLUSÃO: Picos de CPU permanecem em atenção e não foram corrigidos neste período.',
        'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 21 DAY), '00:00:00'), 2),
    ('Interrupção de conexão do FMC reserva', DATE_SUB(CURDATE(), INTERVAL 25 DAY),
        DATE_SUB(CURDATE(), INTERVAL 19 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-AER, FMC pr-aer-spare, com 16 horas de observação em bancada.
O QUE FOI OBSERVADO: Perda de conexão identificada em quatro episódios de 45, 60, 90 e 105 segundos, totalizando cinco minutos sem comunicação com o coletor. O log local do spare manteve registros durante as lacunas; portanto, ausência de telemetria não foi interpretada como uso zero de CPU ou RAM. O mestre permaneceu acessível.
SITUAÇÃO: Mau contato no conector de comunicação é suspeito, pois uma desconexão ocorreu durante movimentação do chicote. Não foi realizado teste de continuidade que confirme a origem. Não há evidência de falha de CPU, RAM ou SSD no material disponível.
POSSÍVEL CAUSA RAIZ: Mau contato no chicote de comunicação é suspeito; a movimentação coincidiu com uma perda, mas não houve teste de continuidade.
AÇÕES REALIZADAS: O analista comparou as lacunas de telemetria com os logs locais e observou o chicote em bancada. Nenhum reparo foi executado.
RECOMENDAÇÕES: Inspecionar os conectores e testar a continuidade do chicote em bancada. Após eventual intervenção, repetir 16 horas de observação e registrar a quantidade e a duração das desconexões.
CONCLUSÃO: Comunicação intermitente ainda não corrigida. A classificação crítica considera a repetição das perdas de observabilidade do FMC reserva, sem afirmar impacto sobre sistemas de voo.',
        'PUBLICADO', 'CRITICO', 'PERDA_CONEXAO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 19 DAY), '00:00:00'), 1),
    ('Análise e acompanhamento dos reinícios do FMC da PR-ANV', DATE_SUB(CURDATE(), INTERVAL 23 DAY),
        DATE_SUB(CURDATE(), INTERVAL 17 DAY), 'RESUMO DO INCIDENTE: Cenário fictício de acompanhamento da PR-ANV após revisão em bancada do FMC pr-anv-mestre. Foram repetidos 14 ciclos com carga equivalente à avaliação dos picos de CPU.
INTERVENÇÕES: O agendamento das tarefas de coleta foi escalonado. A equipe também reassentou o conector de alimentação da placa PL-3, mas não registrou medição elétrica anterior à intervenção.
O QUE FOI OBSERVADO: Uso elevado de CPU corrigido no ensaio de validação: máximo de 69%, contra 88% no ensaio anterior, sem amostras acima de 75%. O tempo de resposta ficou entre 190 e 250 ms. Os reinícios inesperados do mestre não reapareceram nos 14 ciclos após o reassentamento do conector.
SITUAÇÃO: O sintoma de reinício foi corrigido no recorte de validação, mas a causa elétrica permanece suspeita pela ausência de medição. RAM máxima de 76%, sem interrupção por falta de memória. Os resultados não garantem ausência de recorrência fora do ensaio.
POSSÍVEL CAUSA RAIZ: O escalonamento das tarefas é compatível com a redução de CPU. Para os reinícios, o efeito do reassentamento é observado, mas a causa elétrica não foi comprovada por medição.
AÇÕES REALIZADAS: A equipe escalonou as tarefas, reassentou o conector de alimentação e repetiu 14 ciclos. O analista comparou as medições anteriores e posteriores.
RECOMENDAÇÕES: Acompanhar CPU e reinícios por mais sete dias e preservar os logs de qualquer recorrência. Não foi observada nova falha nesta janela.
CLASSIFICAÇÃO: A criticidade registra a gravidade do incidente analisado; a melhora após intervenção não apaga o histórico nem comprova ausência de recorrência.',
        'PUBLICADO', 'CRITICO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 17 DAY), '00:00:00'), 2),
    ('Diagnóstico da placa principal', DATE_SUB(CURDATE(), INTERVAL 21 DAY),
        DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-MNT, em manutenção, com 12 ciclos em bancada do FMC pr-mnt-mestre e inspeção da placa principal PL-5.
O QUE FOI OBSERVADO: Reinício inesperado do FMC mestre identificado em quatro ciclos, com interrupções entre 9 e 16 segundos. Dois eventos ocorreram com RAM entre 66% e 72%, mostrando que os reinícios não se restringem aos episódios de RAM crítica descritos no relatório anterior. O spare não reiniciou.
SITUAÇÃO: Defeito na placa PL-5 é suspeito; a recorrência dos reinícios não confirma qual circuito falhou. O uso elevado de memória permanece identificado em testes separados, com pico de 96%, e ainda não há validação da correção do processo de diagnóstico. Não foi comprovada relação causal entre os dois problemas.
POSSÍVEL CAUSA RAIZ: Falha elétrica na placa PL-5 é suspeita. A investigação deve separar os reinícios do consumo de RAM, pois não há evidência de causa comum.
AÇÕES REALIZADAS: O analista comparou os ciclos com e sem reinício e os testes separados de RAM. A placa foi inspecionada, sem substituição.
RECOMENDAÇÕES: Encaminhar a placa PL-5 para diagnóstico elétrico e avaliar sua substituição conforme o resultado da bancada. Investigar o consumo de RAM separadamente e repetir os ciclos de diagnóstico após cada intervenção.
CONCLUSÃO: Nenhuma substituição foi executada neste período. Os reinícios e o uso elevado de memória continuam pendentes; o ensaio não autoriza conclusão sobre liberação da aeronave.',
        'PUBLICADO', 'CRITICO', 'FALHA_HARDWARE',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 15 DAY), '00:00:00'), 3),
    ('Análise da ocupação de disco e validação da limpeza na PR-AER', DATE_SUB(CURDATE(), INTERVAL 19 DAY),
        DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'RESUMO DO INCIDENTE: Cenário fictício de acompanhamento do SSD de 256 GB do FMC pr-aer-mestre, PR-AER, após o relatório de ocupação de 86%.
INTERVENÇÃO: Após validar a retenção e verificar a cópia, a equipe removeu 18 GB de registros vencidos. A ocupação caiu de 220,16 GB para 202,16 GB, equivalentes a 78,97% da capacidade, com 53,84 GB livres.
O QUE FOI OBSERVADO: Uso elevado de armazenamento corrigido após a limpeza: as verificações seguintes ficaram entre 78,97% e 79,60%, abaixo do limite de atenção de 80%. Nenhuma falha de gravação foi observada durante os sete dias do recorte. O spare terminou com 59% de ocupação.
LIMITAÇÃO: A margem até o limite de atenção permanece pequena. A limpeza tratou a ocupação, mas não demonstrou redução da geração de registros. Não se estima prazo de esgotamento com esta amostra.
POSSÍVEL CAUSA RAIZ: A retenção de registros contribuiu para a ocupação, conforme inventário e volume removido. A limpeza reduz o sintoma, mas não demonstra correção da política de retenção.
AÇÕES REALIZADAS: A equipe validou a retenção, verificou a cópia e removeu 18 GB de registros vencidos. O analista acompanhou a ocupação nos sete dias seguintes.
RECOMENDAÇÕES: Revisar a política de retenção e acompanhar diariamente o espaço livre por mais sete dias. Preservar os registros exigidos antes de qualquer nova remoção.
CLASSIFICAÇÃO: A criticidade registra a gravidade do incidente analisado; a melhora após intervenção não apaga o histórico nem comprova ausência de recorrência.',
        'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 13 DAY), '00:00:00'), 1),
    ('Acompanhamento da memória RAM', DATE_SUB(CURDATE(), INTERVAL 17 DAY),
        DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-ANV, FMC pr-anv-mestre com 16 GB de RAM. Avaliação de 10 ciclos com coleta e geração simultânea de arquivos de diagnóstico.
O QUE FOI OBSERVADO: Uso elevado de memória identificado em três ciclos, com ocupação entre 83% e 89%, acima da atenção de 80% e abaixo do crítico de 95%. O pico equivale a 14,24 GB. O tempo acima de 80% foi de 12 minutos acumulados; a ocupação retornou a 65% ao terminar a geração de arquivos. No spare, RAM máxima de 70%.
SITUAÇÃO: Sobrecarga temporária durante a geração de arquivos é suspeita como causa, sem perfil de memória que comprove a origem. Não foram observadas interrupções por falta de memória, reinícios ou recorrência dos picos de CPU corrigidos no acompanhamento anterior; CPU máxima de 71%.
POSSÍVEL CAUSA RAIZ: Concorrência na geração de arquivos de diagnóstico é suspeita. É necessário medir o consumo por processo para confirmar a origem.
AÇÕES REALIZADAS: O analista comparou ciclos com geração de arquivos e o consumo após o término da tarefa. Não houve alteração de capacidade ou reparo.
RECOMENDAÇÕES: Medir o consumo por processo durante a geração de arquivos e comparar com ciclos sem essa tarefa. Reavaliar a concorrência das tarefas antes de propor aumento de capacidade.
CONCLUSÃO: RAM permanece em atenção, sem correção validada. Este caso compartilha o sintoma de uso elevado de memória com a PR-MNT, mas não confirma uma causa comum.',
        'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 11 DAY), '00:00:00'), 2),
    ('Análise dos picos de CPU e validação do agendamento na PR-AER', DATE_SUB(CURDATE(), INTERVAL 15 DAY),
        DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-AER, FMC pr-aer-mestre. Nos dois primeiros dias do período, três de oito ciclos de bancada tiveram CPU entre 79% e 85% durante consolidação de registros.
INTERVENÇÃO: No terceiro dia, a equipe escalonou a consolidação para evitar sobreposição com a coleta. Foram realizados 12 ciclos equivalentes nos dias restantes.
O QUE FOI OBSERVADO: Uso elevado de CPU corrigido nos 12 ciclos após o ajuste: máximo de 70%, abaixo da atenção de 75% e do crítico de 90%. O tempo de resposta máximo caiu de 430 ms para 260 ms. RAM máxima de 73%, sem reinícios ou perda de comunicação do mestre no recorte.
SITUAÇÃO: A correção do sintoma foi validada sob a carga ensaiada. Não foi feita comparação sob cargas superiores, nem demonstrada relação entre estes picos e a perda de conexão anteriormente registrada no spare.
POSSÍVEL CAUSA RAIZ: Sobreposição da consolidação com a coleta é compatível com os picos e com a melhora após o escalonamento. A conclusão está limitada à carga ensaiada.
AÇÕES REALIZADAS: A equipe escalonou a consolidação no terceiro dia. O analista comparou os oito ciclos iniciais com os 12 ciclos de validação.
RECOMENDAÇÕES: Manter o agendamento revisado e comparar os próximos 12 ciclos com esta validação. Reabrir a investigação se o uso de CPU voltar a ultrapassar 75%.
CLASSIFICAÇÃO: A criticidade registra a gravidade do incidente analisado; a melhora após intervenção não apaga o histórico nem comprova ausência de recorrência.',
        'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 9 DAY), '00:00:00'), 1),
    ('Análise da perda de conexão e validação do reparo na PR-MNT', DATE_SUB(CURDATE(), INTERVAL 13 DAY),
        DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-MNT, em manutenção. O FMC pr-mnt-spare apresentou três perdas de conexão de 30, 50 e 70 segundos no início da janela de bancada.
O QUE FOI OBSERVADO E INTERVENÇÃO: O teste de continuidade identificou interrupção no chicote de comunicação durante movimentação controlada. A equipe substituiu o chicote e repetiu o teste sem interrupção de continuidade.
RESULTADO: Perda de conexão do spare corrigida após a substituição do chicote. Durante 24 horas de observação após a intervenção, não houve nova desconexão. Os logs locais confirmaram que o FMC continuava processando durante as lacunas anteriores.
LIMITAÇÃO: A correção se refere apenas à conexão do spare. Os reinícios da placa PL-5 e o uso elevado de memória do mestre descritos em relatórios anteriores não foram reavaliados neste ensaio e não podem ser considerados corrigidos.
POSSÍVEL CAUSA RAIZ: Interrupção de continuidade no chicote foi reproduzida durante movimentação controlada e não reapareceu após a substituição, sustentando a causa no ensaio.
AÇÕES REALIZADAS: A equipe testou a continuidade, substituiu o chicote e repetiu o teste. O analista acompanhou a comunicação por 24 horas após a intervenção.
RECOMENDAÇÕES: Acompanhar a conexão do spare por mais 24 horas e manter as investigações da placa e da RAM do mestre em registros separados. Este resultado de bancada não altera a condição de manutenção da aeronave.
CLASSIFICAÇÃO: A criticidade registra a gravidade do incidente analisado; a melhora após intervenção não apaga o histórico nem comprova ausência de recorrência.',
        'PUBLICADO', 'CRITICO', 'PERDA_CONEXAO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 7 DAY), '00:00:00'), 3),
    ('Análise de desempenho da semana', DATE_SUB(CURDATE(), INTERVAL 11 DAY),
        DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-AER, FMC pr-aer-mestre. Relatório em revisão sobre 10 ciclos após o ajuste das tarefas de coleta.
O QUE FOI OBSERVADO: Tempo de resposta elevado identificado em dois ciclos: 620 e 680 ms, contra faixa de referência de 180 a 260 ms. Nos mesmos ciclos, CPU máxima de 72%, RAM máxima de 78% e armazenamento de 79,70%, abaixo dos respectivos limites de atenção. Não houve reinício observado.
HIPÓTESE: Espera por gravação durante a consolidação de arquivos é suspeita. Não foi coletada latência do SSD; os dados disponíveis não comprovam falha de armazenamento nem nova sobrecarga de CPU.
POSSÍVEL CAUSA RAIZ: Espera por gravação na consolidação é suspeita; não foi medida latência do SSD. CPU e RAM abaixo dos limites não descartam gargalo de entrada e saída.
AÇÕES REALIZADAS: O analista comparou os tempos de resposta e o consumo dos componentes em 10 ciclos. A medição de latência do SSD ainda não foi realizada.
RECOMENDAÇÕES: Coletar latência de gravação e tempo de resposta com e sem consolidação de arquivos em 10 ciclos equivalentes. Revisar os resultados com o coavaliador antes da publicação.
PENDÊNCIA: A oscilação permanece sem correção e a cobertura de comunicação do spare não foi avaliada neste relatório. O parecer é preliminar e não encerra ocorrências anteriores.',
        'EM_REVISAO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 5 DAY), '00:00:00'), 1),
    ('Revisão do módulo de hardware', DATE_SUB(CURDATE(), INTERVAL 10 DAY),
        DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'RESUMO DO INCIDENTE: Cenário fictício de inspeção preventiva da placa PL-3 do FMC pr-anv-mestre, PR-ANV. Documento em revisão após o acompanhamento sem reinícios da janela anterior.
O QUE FOI OBSERVADO: A inspeção visual registrou uma marca escurecida próxima ao conector de alimentação. Em seis ciclos de bancada, não houve reinício; CPU máxima de 70% e RAM máxima de 77%. Não foram realizadas medições de temperatura ou tensão no ponto observado.
SITUAÇÃO: Aquecimento anormal do conector é suspeito, sem evidência suficiente para confirmar superaquecimento ou defeito da placa. A marca visual não comprova a causa dos reinícios históricos, cujo sintoma não reapareceu neste recorte.
POSSÍVEL CAUSA RAIZ: Aquecimento ou alimentação irregular no conector são hipóteses ainda sem medições. A marca visual não confirma superaquecimento nem explica os reinícios históricos.
AÇÕES REALIZADAS: A equipe realizou inspeção visual e seis ciclos de bancada. O analista revisou o histórico; não foram feitas medições térmicas ou elétricas.
RECOMENDAÇÕES: Medir temperatura e tensão do conector sob carga controlada e comparar com a especificação do fabricante antes de concluir o parecer. Anexar os resultados da medição à revisão.
PENDÊNCIA: A hipótese não foi confirmada nem corrigida. Não há recomendação de substituição definitiva sem o diagnóstico complementar.',
        'EM_REVISAO', 'ATENCAO', 'FALHA_HARDWARE',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 4 DAY), '00:00:00'), 2),
    ('Planejamento de limpeza do armazenamento', DATE_SUB(CURDATE(), INTERVAL 9 DAY),
        DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-MNT, FMC pr-mnt-mestre em bancada. Rascunho de planejamento de capacidade do SSD de 256 GB.
O QUE FOI OBSERVADO: Uso elevado de armazenamento identificado: ocupação de 84%, equivalente a 215,04 GB, com 40,96 GB livres. O limite de atenção é 80% e o crítico é 90%. O inventário preliminar encontrou 12 GB de arquivos de diagnóstico cuja retenção ainda não foi validada. Não houve falha de gravação nos quatro ciclos observados.
PLANEJAMENTO: A remoção integral desses 12 GB reduziria a ocupação para aproximadamente 79,31%, mas essa projeção não é uma medição nem comprova correção. Nenhum arquivo foi removido.
POSSÍVEL CAUSA RAIZ: Acúmulo de arquivos de diagnóstico é suspeito, mas sua retenção ainda precisa ser validada. Não há base para atribuir os incidentes de RAM ou placa ao SSD.
AÇÕES REALIZADAS: O analista inventariou preliminarmente 12 GB de arquivos e calculou a projeção de espaço. Nenhuma limpeza foi executada.
RECOMENDAÇÕES: Validar a retenção dos arquivos e realizar cópia verificada antes de autorizar qualquer remoção. Medir novamente o espaço livre após a intervenção e observar o crescimento durante sete dias.
PENDÊNCIA: O uso elevado permanece identificado. A análise de capacidade não investiga nem encerra as ocorrências de placa e RAM do mesmo FMC.',
        'RASCUNHO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 3 DAY), '00:00:00'), 3),
    ('Investigação do consumo de RAM', DATE_SUB(CURDATE(), INTERVAL 8 DAY),
        DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-AER, FMC pr-aer-mestre com 16 GB de RAM. Rascunho de investigação em cinco ciclos de diagnóstico com exportação de registros.
O QUE FOI OBSERVADO: Uso elevado de memória identificado em dois ciclos, com pico de 96%, equivalente a 15,36 GB, acima do crítico de 95%. O processo de exportação foi interrompido uma vez por falta de memória. CPU máxima de 74%, sem reinício do FMC. O spare permaneceu abaixo de 73% de RAM.
HIPÓTESE: Retenção de buffers pelo processo de exportação é suspeita, pois a ocupação aumentou de 68% para 96% durante a tarefa. Não houve perfil de alocações nem teste físico da RAM, portanto não se confirma vazamento ou defeito do módulo.
POSSÍVEL CAUSA RAIZ: Retenção de buffers pelo processo de exportação é suspeita. Faltam perfil de alocações e repetição controlada para confirmar a causa.
AÇÕES REALIZADAS: O analista comparou os cinco ciclos de exportação, o crescimento da RAM e o registro de interrupção. Não houve correção validada.
RECOMENDAÇÕES: Coletar perfil de memória durante a exportação e repetir os cinco ciclos após o ajuste proposto. Verificar ausência de interrupção e RAM abaixo de 80% antes de encerrar a ocorrência.
PENDÊNCIA: Não houve correção validada. O sintoma também aparece em relatórios da PR-ANV e PR-MNT, mas os processos e as condições diferem; não se atribui causa comum sem investigação.',
        'RASCUNHO', 'CRITICO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 2 DAY), '00:00:00'), 1),
    ('Análise do consumo de RAM e validação do ajuste na PR-ANV', DATE_SUB(CURDATE(), INTERVAL 7 DAY),
        DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'RESUMO DO INCIDENTE: Cenário fictício da PR-ANV, com 18 ciclos de bancada dos FMCs pr-anv-mestre e pr-anv-spare.
INTERVENÇÃO: Antes dos ciclos de validação, a equipe limitou a geração simultânea de arquivos de diagnóstico no mestre para tratar o uso elevado de memória da janela anterior.
O QUE FOI OBSERVADO: Uso elevado de memória corrigido nos 18 ciclos de validação: RAM máxima de 76%, contra 89% anteriormente, abaixo da atenção de 80%. CPU máxima de 71%, armazenamento de 65% e tempo de resposta entre 190 e 250 ms. Não foram observados reinícios nem perda de conexão nos dois FMCs.
LIMITAÇÃO: A suspeita de aquecimento do conector da placa PL-3 não foi investigada por medição térmica nesta janela. A ausência de reinícios não confirma nem descarta essa hipótese de hardware.
POSSÍVEL CAUSA RAIZ: A sobreposição da geração de arquivos com a coleta é compatível com o consumo de RAM e com a melhora após limitar a concorrência. A hipótese de hardware da placa PL-3 segue independente.
AÇÕES REALIZADAS: A equipe limitou a geração simultânea de arquivos. O analista comparou os 18 ciclos seguintes com a janela anterior.
RECOMENDAÇÕES: Manter a limitação de concorrência e acompanhar a RAM por mais sete dias. Concluir a medição do conector registrada no parecer em revisão.
CLASSIFICAÇÃO: A criticidade registra a gravidade do incidente analisado; a melhora após intervenção não apaga o histórico nem comprova ausência de recorrência.',
        'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 1 DAY), '00:00:00'), 2),
    ('Análise e acompanhamento dos incidentes de RAM e conexão na PR-AER', DATE_SUB(CURDATE(), INTERVAL 6 DAY),
        DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'RESUMO DO INCIDENTE: Cenário fictício de verificação da PR-AER em seis ciclos equivalentes de bancada dos FMCs pr-aer-mestre e pr-aer-spare, após as ocorrências registradas nas janelas anteriores.
INTERVENÇÕES: No mestre, a equipe corrigiu a liberação de buffers do processo de exportação e separou a consolidação da janela de coleta. No spare, substituiu o conector após teste de continuidade confirmar mau contato no chicote.
O QUE FOI OBSERVADO: Uso elevado de memória do mestre corrigido nos seis ciclos após o ajuste, com RAM máxima de 77%, contra 96% antes, sem interrupção da exportação. Tempo de resposta elevado corrigido no mesmo ensaio, com máximo de 250 ms, contra 680 ms antes. Perda de conexão do spare corrigida após a troca do conector, sem desconexões em 16 horas de observação. CPU máxima de 70% e armazenamento do mestre de 79,80%, abaixo da atenção de 80%.
LIMITAÇÃO: A margem de armazenamento continua pequena e a amostra de seis ciclos não garante ausência de recorrência. Os resultados são de bancada, sem parecer de aeronavegabilidade.
POSSÍVEL CAUSA RAIZ: O ajuste de liberação de buffers é compatível com a melhora da RAM. Para a conexão do spare, o teste de continuidade sustenta o mau contato. O efeito sobre latência não foi isolado das demais alterações.
AÇÕES REALIZADAS: A equipe ajustou a liberação de buffers e o agendamento, além de substituir o conector do spare. O analista comparou os ciclos e os registros de comunicação após as intervenções.
RECOMENDAÇÕES: Acompanhar memória, tempo de resposta e comunicação por mais sete dias. Revisar a retenção de registros antes de a ocupação atingir novamente 80%.
CLASSIFICAÇÃO: A criticidade registra a gravidade do incidente analisado; a melhora após intervenção não apaga o histórico nem comprova ausência de recorrência.',
        'PUBLICADO', 'CRITICO', 'DESEMPENHO',
        TIMESTAMP(DATE_SUB(CURDATE(), INTERVAL 0 DAY), '00:00:00'), 1);

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
VALUES
    (DATE_SUB(CURDATE(), INTERVAL 29 DAY), 'AUTOR', 2, 1),
    (DATE_SUB(CURDATE(), INTERVAL 27 DAY), 'AUTOR', 4, 2),
    (DATE_SUB(CURDATE(), INTERVAL 25 DAY), 'AUTOR', 3, 3),
    (DATE_SUB(CURDATE(), INTERVAL 23 DAY), 'AUTOR', 5, 4),
    (DATE_SUB(CURDATE(), INTERVAL 21 DAY), 'AUTOR', 6, 5),
    (DATE_SUB(CURDATE(), INTERVAL 19 DAY), 'AUTOR', 3, 6),
    (DATE_SUB(CURDATE(), INTERVAL 17 DAY), 'AUTOR', 2, 7),
    (DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'AUTOR', 4, 8),
    (DATE_SUB(CURDATE(), INTERVAL 13 DAY), 'AUTOR', 3, 9),
    (DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'AUTOR', 5, 10),
    (DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'AUTOR', 6, 11),
    (DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'AUTOR', 7, 12),
    (DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'AUTOR', 2, 13),
    (DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'AUTOR', 4, 14),
    (DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'AUTOR', 3, 15),
    (DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'AUTOR', 5, 16),
    (DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'AUTOR', 2, 17),
    (DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'AUTOR', 2, 18);

SET @agora_kpi = NOW();
SET @autor_kpi = (SELECT idFuncionario FROM funcionario WHERE emailCorporativo = 'otavio@gmail.com' AND cargo = 'ANALISTA' LIMIT 1);

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT 'Análise de CPU crítica no FMC mestre da PR-AER', DATE(DATE_SUB(@agora_kpi, INTERVAL 40 MINUTE)), DATE(DATE_SUB(@agora_kpi, INTERVAL 10 MINUTE)),
    'RESUMO DO INCIDENTE: Cenário fictício para demonstração, sem vínculo com alertas reais do S3. FMC pr-aer-mestre, PR-AER. O analista avaliou os incidentes de CPU da janela anterior à elaboração deste parecer.
O QUE FOI OBSERVADO: CPU de 93% a 96% por seis minutos durante exportação simultânea à coleta, acima do crítico de 90%. O tempo de resposta passou de 220 ms para 640 ms. Não houve reinício registrado.
POSSÍVEL CAUSA RAIZ: Concorrência entre exportação e coleta é suspeita pela coincidência dos eventos. O perfil por processo ainda não foi coletado; não há confirmação de defeito físico.
AÇÕES REALIZADAS: O analista comparou as janelas com e sem exportação e revisou os logs do mestre. Nenhum ajuste foi aplicado.
RECOMENDAÇÕES: Coletar perfil por processo, testar o escalonamento da exportação em bancada e comparar CPU e tempo de resposta sob a mesma carga.
SITUAÇÃO: Uso elevado de CPU identificado e sem correção validada. O gestor deve acompanhar o diagnóstico e a validação antes de considerar o incidente tratado.', 'PENDENTE',
    'PUBLICADO', 'CRITICO', 'DESEMPENHO',
    DATE_SUB(@agora_kpi, INTERVAL 10 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-AER' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(DATE_SUB(@agora_kpi, INTERVAL 10 MINUTE)), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT 'Análise de memória crítica no FMC reserva da PR-ANV', DATE(DATE_SUB(@agora_kpi, INTERVAL 50 MINUTE)), DATE(DATE_SUB(@agora_kpi, INTERVAL 20 MINUTE)),
    'RESUMO DO INCIDENTE: Cenário fictício para demonstração, sem vínculo com alertas reais do S3. FMC pr-anv-spare, PR-ANV. Parecer sobre o crescimento de RAM durante a geração de arquivos de diagnóstico antes da publicação.
O QUE FOI OBSERVADO: RAM subiu de 68% para 97% em três execuções, acima do crítico de 95%. A última exportação foi interrompida por falta de memória. CPU permaneceu abaixo de 75%.
POSSÍVEL CAUSA RAIZ: Retenção de buffers pelo processo de exportação é suspeita. O crescimento acumulado não confirma sozinho vazamento nem defeito do módulo de RAM.
AÇÕES REALIZADAS: O analista comparou as três execuções e o log da interrupção. O reinício do processo reduziu a RAM para 69%, como contenção temporária.
RECOMENDAÇÕES: Coletar perfil de alocações, investigar a liberação de buffers e repetir as três execuções após o ajuste, verificando memória e conclusão das exportações.
SITUAÇÃO: Uso elevado de memória identificado. A contenção não comprova correção; o diagnóstico continua pendente.', 'PENDENTE',
    'PUBLICADO', 'CRITICO', 'DESEMPENHO',
    DATE_SUB(@agora_kpi, INTERVAL 20 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-ANV' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(DATE_SUB(@agora_kpi, INTERVAL 20 MINUTE)), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT 'Análise da ocupação de disco no FMC mestre da PR-AER', DATE(DATE_SUB(@agora_kpi, INTERVAL 60 MINUTE)), DATE(DATE_SUB(@agora_kpi, INTERVAL 30 MINUTE)),
    'RESUMO DO INCIDENTE: Cenário fictício para demonstração, sem vínculo com alertas reais do S3. FMC pr-aer-mestre, PR-AER. Análise do incidente de capacidade de armazenamento na janela anterior à elaboração do relatório.
O QUE FOI OBSERVADO: SSD de 256 GB com ocupação de 85%, acima da atenção de 80% e abaixo do crítico de 90%. O inventário identificou 16 GB de registros com prazo de retenção vencido, sem falhas de gravação.
POSSÍVEL CAUSA RAIZ: Acúmulo de registros de diagnóstico sem expurgo é suspeito. O inventário aponta contribuição desses arquivos, mas os demais diretórios não foram integralmente avaliados.
AÇÕES REALIZADAS: O analista verificou a ocupação e separou os arquivos por prazo de retenção. Nenhum arquivo foi excluído.
RECOMENDAÇÕES: Validar a retenção com a equipe responsável, verificar a cópia dos registros e remover apenas os arquivos autorizados. Medir a ocupação após a limpeza e revisar o expurgo periódico.
SITUAÇÃO: Uso elevado de armazenamento identificado e sem correção validada. A publicação documenta a análise, sem encerrar o incidente.', 'PENDENTE',
    'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
    DATE_SUB(@agora_kpi, INTERVAL 30 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-AER' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(DATE_SUB(@agora_kpi, INTERVAL 30 MINUTE)), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT 'Análise dos picos de CPU no FMC mestre da PR-ANV', DATE(DATE_SUB(@agora_kpi, INTERVAL 70 MINUTE)), DATE(DATE_SUB(@agora_kpi, INTERVAL 40 MINUTE)),
    'RESUMO DO INCIDENTE: Cenário fictício para demonstração, sem vínculo com alertas reais do S3. FMC pr-anv-mestre, PR-ANV. Avaliação de cinco ciclos de coleta concluídos antes da elaboração do parecer.
O QUE FOI OBSERVADO: Dois ciclos apresentaram CPU entre 81% e 86% e resposta de até 450 ms durante consolidação simultânea de arquivos. Os outros três ficaram abaixo de 70%, sem reinícios.
POSSÍVEL CAUSA RAIZ: Sobreposição da consolidação com a coleta é suspeita. A comparação mostra associação temporal, mas falta teste controlado para confirmar a causa raiz.
AÇÕES REALIZADAS: O analista comparou os cinco ciclos e os horários das tarefas. Nenhuma alteração de agendamento foi realizada.
RECOMENDAÇÕES: Testar o escalonamento da consolidação em cinco ciclos equivalentes e comparar CPU e tempo de resposta, preservando os logs para revisão.
SITUAÇÃO: Picos de CPU identificados em atenção. A investigação e a validação do ajuste permanecem pendentes.', 'PENDENTE',
    'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
    DATE_SUB(@agora_kpi, INTERVAL 40 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-ANV' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(DATE_SUB(@agora_kpi, INTERVAL 40 MINUTE)), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT 'Análise de CPU crítica registrada na janela anterior da PR-AER', DATE(DATE_SUB(@agora_kpi, INTERVAL 105 MINUTE)), DATE(DATE_SUB(@agora_kpi, INTERVAL 75 MINUTE)),
    'RESUMO DO INCIDENTE: Cenário fictício para demonstração, sem vínculo com alertas reais do S3. FMC pr-aer-mestre, PR-AER. Parecer elaborado após investigação de um episódio de CPU crítica anterior à sua publicação.
O QUE FOI OBSERVADO: CPU atingiu 94% por quatro minutos durante uma exportação, com tempo de resposta de 610 ms. Após o término da tarefa, caiu para 66%. Não houve reinício.
POSSÍVEL CAUSA RAIZ: A exportação concorrente à coleta é suspeita de provocar a sobrecarga. A queda após seu término não confirma qual rotina consumiu CPU nem elimina recorrência.
AÇÕES REALIZADAS: O analista correlacionou os horários da exportação e do pico e comparou os registros após a tarefa. Não houve mudança de configuração.
RECOMENDAÇÕES: Identificar as rotinas de maior consumo com perfil de execução e comparar a exportação isolada e concorrente sob a mesma carga antes de alterar o agendamento.
SITUAÇÃO: Uso elevado de CPU identificado. O retorno abaixo do limite é observado, mas não representa correção validada.', 'PENDENTE',
    'PUBLICADO', 'CRITICO', 'DESEMPENHO',
    DATE_SUB(@agora_kpi, INTERVAL 75 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-AER' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(DATE_SUB(@agora_kpi, INTERVAL 75 MINUTE)), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

INSERT INTO relatorio (
    titulo, periodoInicio, periodoFim, texto, statusAnalise,
    statusRelatorio, criticidade, categoria, dataCriacao, fkAeronave
)
SELECT 'Análise de armazenamento registrada na janela anterior da PR-AER', DATE(DATE_SUB(@agora_kpi, INTERVAL 120 MINUTE)), DATE(DATE_SUB(@agora_kpi, INTERVAL 90 MINUTE)),
    'RESUMO DO INCIDENTE: Cenário fictício para demonstração, sem vínculo com alertas reais do S3. FMC pr-aer-mestre, PR-AER. Parecer sobre o incidente de armazenamento investigado antes da publicação, com atualização em relatório posterior.
O QUE FOI OBSERVADO: Ocupação de 83% no SSD de 256 GB, acima da atenção de 80%. O inventário preliminar encontrou 10 GB de arquivos temporários de diagnóstico. Não foram registradas falhas de gravação.
POSSÍVEL CAUSA RAIZ: Retenção excessiva de arquivos temporários é suspeita. A avaliação não confirmou quais arquivos podem ser removidos nem isolou outras fontes de crescimento.
AÇÕES REALIZADAS: O analista revisou a ocupação e o inventário preliminar, sem excluir arquivos. Os registros foram mantidos para a investigação.
RECOMENDAÇÕES: Validar a política de retenção, identificar os arquivos elegíveis e verificar sua cópia antes de qualquer remoção. Registrar a ocupação após a intervenção e acompanhar novas coletas.
SITUAÇÃO: Uso elevado de armazenamento identificado em atenção. A limpeza e sua validação permanecem pendentes.', 'PENDENTE',
    'PUBLICADO', 'ATENCAO', 'DESEMPENHO',
    DATE_SUB(@agora_kpi, INTERVAL 90 MINUTE), a.idAeronave
FROM aeronave a
JOIN funcionario f ON f.fkEmpresaFabricante = a.fkEmpresaFabricante
WHERE a.nome = 'PR-AER' AND f.idFuncionario = @autor_kpi
ORDER BY a.idAeronave
LIMIT 1;

SET @inseriu_kpi = ROW_COUNT();
SET @relatorio_kpi = LAST_INSERT_ID();

INSERT INTO funcionarioRelatorio (dataVinculo, papel, fkFuncionario, fkRelatorio)
SELECT DATE(DATE_SUB(@agora_kpi, INTERVAL 90 MINUTE)), 'AUTOR', @autor_kpi, @relatorio_kpi
WHERE @inseriu_kpi = 1;

SELECT idRelatorio, titulo, criticidade, dataCriacao
FROM relatorio
WHERE titulo IN (
    'Análise de CPU crítica no FMC mestre da PR-AER',
    'Análise de memória crítica no FMC reserva da PR-ANV',
    'Análise da ocupação de disco no FMC mestre da PR-AER',
    'Análise dos picos de CPU no FMC mestre da PR-ANV',
    'Análise de CPU crítica registrada na janela anterior da PR-AER',
    'Análise de armazenamento registrada na janela anterior da PR-AER'
)
    AND dataCriacao BETWEEN DATE_SUB(@agora_kpi, INTERVAL 90 MINUTE) AND @agora_kpi
ORDER BY dataCriacao DESC;
