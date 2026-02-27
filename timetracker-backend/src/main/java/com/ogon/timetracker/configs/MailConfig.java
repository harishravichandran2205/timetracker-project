package com.ogon.timetracker.configs;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ogon.timetracker.dto.MailConfigDTO;
import com.ogon.timetracker.encryption.EncryptionUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.io.InputStream;
import java.util.Properties;

@Configuration
public class MailConfig {

    @Bean
    public JavaMailSender javaMailSender() {

        try {
            ObjectMapper mapper = new ObjectMapper();

            InputStream inputStream =
                    new ClassPathResource("mail-config.json")
                            .getInputStream();

            MailConfigDTO mailConfig =
                    mapper.readValue(inputStream, MailConfigDTO.class);

            JavaMailSenderImpl mailSender =
                    new JavaMailSenderImpl();

            mailSender.setHost(mailConfig.getHost());
            mailSender.setPort(mailConfig.getPort());
            String decryptedMail = EncryptionUtil.decrypt(mailConfig.getUsername());
            mailSender.setUsername(decryptedMail);
            String decryptedPassword = EncryptionUtil.decrypt(mailConfig.getPassword());
            mailSender.setPassword(decryptedPassword);

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");

            return mailSender;

        } catch (Exception e) {
            throw new RuntimeException("Failed to load mail configuration", e);
        }
    }
}