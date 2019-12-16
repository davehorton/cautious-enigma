CREATE TABLE `conferences`
  (
    `id`                INT NOT NULL AUTO_INCREMENT,
    `date_created`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `meeting_pin`       INT NOT NULL UNIQUE,
    `description`       VARCHAR(255),
    `freeswitch_ip`     VARCHAR(21),
    PRIMARY KEY (`id`)
  );

CREATE TABLE `transcriptions`
  (
    `id`                INT NOT NULL AUTO_INCREMENT,
    `time_start`        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `time_end`          TIMESTAMP NULL DEFAULT NULL,
    `conference_id`     INT NOT NULL,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`conference_id`) REFERENCES conferences(`id`)
    ON DELETE CASCADE
  );

CREATE TABLE `utterances`
  (
    `id`                INT NOT NULL AUTO_INCREMENT,
    `seq`               INT NOT NULL,
    `speech`            VARCHAR(65500) NOT NULL,
    `start`             DECIMAL(12,6),
    `duration`          DECIMAL(12,6),
    `confidence`        DECIMAL(5,2),
    `transcription_id`  INT NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY (`seq`, `transcription_id`),
    FOREIGN KEY (`transcription_id`) REFERENCES transcriptions(`id`)
    ON DELETE CASCADE
  );
